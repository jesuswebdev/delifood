'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after, Done } from 'mocha';
import { expect } from 'chai';
import {
  cloneObject,
  getModel,
  RoleModel,
  RoleDocument,
  UserModel,
  UserAttributes,
  PermissionModel,
  PermissionDocument
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

const insertDummyRole = async function insertDummyRole(
  model: RoleModel,
  text?: string
): Promise<RoleDocument> {
  const doc = await model.create({
    name: text ?? 'Dummy role',
    description: 'Dummy role description'
  });
  return doc;
};

async function insertDummyPermission(
  model: PermissionModel,
  text?: string
): Promise<PermissionDocument> {
  const p: PermissionDocument = await model.create({
    name: `Dummy Permission${text ? ' ' + text : ''}`,
    value: 'create:permission',
    description: 'Dummy Permission description'
  });
  return p;
}

const cleanUp = async function cleanUp(server: Server) {
  const userModel = getModel<UserModel>(server.plugins, 'User');
  const roleModel = getModel<RoleModel>(server.plugins, 'Role');

  await userModel.deleteMany();
  await roleModel.deleteMany();
};

describe('Test User Routes', async () => {
  let server: Server;
  let mongod: MongoMemoryServer;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    await init({ mongodbUri: mongod.getUri() }).then(s => {
      server = s;
    });
  });

  after((done: Done) => {
    server.stop();
    mongod.stop().then(() => {
      done();
    });
  });

  describe('Sign Up route', () => {
    let request: ServerInjectOptions;
    let roleModel: RoleModel;

    beforeEach(async () => {
      await cleanUp(server);
      request = {
        method: 'POST',
        url: '/signup',
        payload: {
          email: 'test@test.com',
          password: 'password1234'
        }
      };
      roleModel = getModel<RoleModel>(server.plugins, 'Role');

      await insertDummyRole(roleModel, 'User');
    });

    it('should create a user', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(201);
    });

    it('should fail when the email is not valid', async () => {
      (request.payload as UserAttributes).email = 'newmail';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when password is short', async () => {
      (request.payload as UserAttributes).password = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate users', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(201);
      const response_2 = await server.inject(request);
      expect(response_2.statusCode).to.equal(409);
    });
  });

  describe('Sign In route', () => {
    let request: ServerInjectOptions;
    const defaultPayloadObject = {
      email: 'test@test.com',
      password: 'password1234'
    };

    before(async () => {
      const permissionModel = getModel<PermissionModel>(
        server.plugins,
        'Permission'
      );
      const roleModel = getModel<RoleModel>(server.plugins, 'Role');
      const userModel = getModel<UserModel>(server.plugins, 'User');

      await permissionModel.deleteMany();
      await roleModel.deleteMany();
      await userModel.deleteMany();

      const dummyPermission = await insertDummyPermission(permissionModel);
      const dummyRole = await insertDummyRole(roleModel);

      dummyRole.permissions = [dummyPermission];
      await dummyRole.save();

      await userModel.create({
        email: 'test@test.com',
        password: 'password1234',
        roles: [dummyRole]
      });
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'POST',
        url: '/signin',
        payload: cloneObject({ ...defaultPayloadObject })
      };
      done();
    });

    it('should fail when email is empty', async () => {
      (request.payload as UserAttributes).email = '';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    it('should fail when email is not valid', async () => {
      (request.payload as UserAttributes).email = 'asdasdasd';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    it('should fail when email is short', async () => {
      (request.payload as UserAttributes).email = 'a@b.c';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when password is empty', async () => {
      (request.payload as UserAttributes).password = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    it('should fail when password is short', async () => {
      (request.payload as UserAttributes).password = 'asdf';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    it('should fail when passing wrong email/password combination', async () => {
      (request.payload as UserAttributes).password = 'testpassword';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });
    it('should fail when email does not exist', async () => {
      (request.payload as UserAttributes).email = 'wrong@email.com';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
    it('should return user data and auth token when successfully signing in', async () => {
      const response = await server.inject(request);
      const result = response.result as {
        user: { email: string; roles: string[]; permissions: string[] };
        token: string;
      };
      expect(response.statusCode).to.equal(200);
      expect(result.token).to.exist;
      expect(result.user.email).to.exist;
      expect(result.user.roles).to.exist;
      expect(result.user.permissions).to.exist;
    });
  });
});
