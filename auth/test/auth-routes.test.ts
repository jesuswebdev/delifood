'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after, Done } from 'mocha';
import { expect } from 'chai';
import {
  cloneObject,
  getModel,
  RoleModel,
  UserModel,
  UserAttributes,
  PermissionModel,
  insertDummyRole,
  insertDummyPermission,
  insertDummyUser
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

const cleanUp = async function cleanUp(server: Server) {
  const userModel = getModel<UserModel>(server.plugins, 'User');
  const roleModel = getModel<RoleModel>(server.plugins, 'Role');
  const permissionModel = getModel<PermissionModel>(
    server.plugins,
    'Permission'
  );
  await Promise.allSettled([
    userModel.deleteMany(),
    roleModel.deleteMany(),
    permissionModel.deleteMany()
  ]);
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
    let request: ServerInjectOptions & { payload: Partial<UserAttributes> };

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
      // sign up requires User role to exist
      await insertDummyRole(getModel(server.plugins, 'Role'), { name: 'User' });
    });

    it('should create a user', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(201);
    });

    it('should fail when the email is not valid', async () => {
      request.payload.email = 'newmail';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when password is short', async () => {
      request.payload.password = 'new';
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
    let request: ServerInjectOptions & { payload: Partial<UserAttributes> };
    const defaultPayloadObject = {
      email: 'test@test.com',
      password: 'password1234'
    };

    before(async () => {
      await cleanUp(server);

      const dummyPermission = await insertDummyPermission(
        getModel(server.plugins, 'Permission')
      );
      const dummyRole = await insertDummyRole(
        getModel(server.plugins, 'Role'),
        { permissions: [dummyPermission._id] }
      );

      await insertDummyUser(getModel(server.plugins, 'User'), {
        ...defaultPayloadObject,
        roles: [dummyRole._id]
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
      request.payload.email = '';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    it('should fail when email is not valid', async () => {
      request.payload.email = 'asdasdasd';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    it('should fail when email is short', async () => {
      request.payload.email = 'a@b.c';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when password is empty', async () => {
      request.payload.password = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    it('should fail when password is short', async () => {
      request.payload.password = 'asdf';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    it('should fail when passing wrong email/password combination', async () => {
      request.payload.password = 'testpassword';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });
    it('should fail when email does not exist', async () => {
      request.payload.email = 'wrong@email.com';
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
