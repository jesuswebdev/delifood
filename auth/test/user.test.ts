'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after, Done } from 'mocha';
import { expect } from 'chai';
import {
  cloneObject,
  AUTH_STRATEGY,
  getModel,
  RoleModel,
  RoleDocument,
  UserModel,
  LeanUserDocument,
  UserAttributes,
  UserDocument
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

const insertDummyRole = async function insertDummyRole(
  model: RoleModel,
  text?: string
): Promise<RoleDocument> {
  const doc = await model.create({
    name: `Dummy role${text ? ' ' + text : ''}`,
    description: 'Dummy role description'
  });
  return doc;
};

const insertDummyUser = async function insertDummyUser(
  model: UserModel
): Promise<UserDocument> {
  const doc = await model.create({
    email: 'dummyuser@test.com',
    password: 'password1234'
  });
  return doc;
};

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

  describe('Create User', () => {
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['create:user'] }
    };

    beforeEach((done: Done) => {
      request = {
        method: 'POST',
        url: '/users',
        payload: {
          email: 'test@test.com',
          password: 'password1234'
        },
        auth: cloneObject(defaultAuthObject)
      };
      const model = getModel<UserModel>(server.plugins, 'User');
      model
        .deleteMany()
        .exec()
        .then(() => done());
    });

    it('should create a user', async () => {
      const response = await server.inject(request);

      const result = response.result as LeanUserDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.email).to.equal((request.payload as UserAttributes).email);
    });

    it('should not return the password when creating a user', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanUserDocument;
      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.password).to.not.exist;
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:user'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
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

  describe('Get User', () => {
    let user: UserDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['get:user'] }
    };

    before(async () => {
      const roleModel = getModel<RoleModel>(server.plugins, 'Role');
      const model = getModel<UserModel>(server.plugins, 'User');
      await model.deleteMany();

      const dummyRole = await insertDummyRole(roleModel);

      user = await model.create({
        email: 'user@test.com',
        password: 'password1234'
      });

      user.roles = [dummyRole];
      await user.save();
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/users/' + user._id,
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should fail when id length is not 24', async () => {
      request.url += 'ab123';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when id is not a hex string', async () => {
      request.url = '/users/aaaaaaaaaaaaaaaaaaaaaaaz';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when id is not present', async () => {
      request.url = '/users/';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should return 404 when user does not exist', async () => {
      request.url = '/users/aaaaaaaaaaaaaaaaaaaaaaa1';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should fail when scope is not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['list:user'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when user credentials are not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials = {
        user: undefined,
        app: 'test',
        scope: ['get:user']
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should return the found user', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanUserDocument;
      expect(response.statusCode).to.equal(200);
      expect(result._id).to.exist;
      expect(result.email).to.exist;
      expect(result.password).to.not.exist;
      expect(Array.isArray(result.roles)).to.be.true;
    });
  });

  describe('List Users', () => {
    let userModel: UserModel;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['list:user'] }
    };

    before(async () => {
      await cleanUp(server);
      userModel = getModel<UserModel>(server.plugins, 'User');

      await userModel.create({
        email: 'user@test.com',
        password: 'password1234'
      });
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/users',
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should return an array of users', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanUserDocument[];
      expect(Array.isArray(result)).to.be.true;
      expect(result[0]._id).to.exist;
      expect(result[0].email).to.exist;
      expect(result[0].password).to.not.exist;
    });

    it('should return an empty array', async () => {
      await userModel.deleteMany();
      const response = await server.inject(request);
      const result = response.result as LeanUserDocument[];
      expect(Array.isArray(result)).to.be.true;
      expect(result.length).to.equal(0);
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:user'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });
  });

  describe('Patch User', () => {
    let userModel: UserModel;
    let user: UserDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['patch:user'] }
    };

    before(async () => {
      await cleanUp(server);
      userModel = getModel<UserModel>(server.plugins, 'User');
      user = await userModel.create({
        email: 'user@test.com',
        password: 'password1234'
      });
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'PATCH',
        url: '/users/' + user._id,
        payload: {
          email: 'newuser@test.com',
          password: 'qwerqwer1234'
        },
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should patch a user', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a user email only', async () => {
      (request.payload as { email: string }) = {
        email: 'userpatch@test.com'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a user password only', async () => {
      (request.payload as { password: string }) = {
        password: 'patchedpassword1234'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:user'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when the email is short', async () => {
      (request.payload as UserAttributes).email = 'a@b.c';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when password is short', async () => {
      (request.payload as UserAttributes).password = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate users', async () => {
      await userModel.create({
        email: 'test2@test.com',
        password: 'password1234'
      });
      (request.payload as UserAttributes).email = 'test2@test.com';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(409);
    });

    it('should fail with error 404 when user does not exist / no rows affected by update query', async () => {
      request.url = '/users/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('Delete User', () => {
    let userModel: UserModel;
    let user: UserDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['delete:user'] }
    };

    before(async () => {
      userModel = getModel<UserModel>(server.plugins, 'User');
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      user = await insertDummyUser(userModel);
      request = {
        method: 'DELETE',
        url: '/users/' + user._id,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should delete a user', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject(defaultAuthObject);
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject(defaultAuthObject);
      request.auth.credentials.scope = ['save:user'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail with error 404 when user does not exist / no rows affected by update query', async () => {
      request.url = '/users/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('Update User Roles', () => {
    let userModel: UserModel;
    let user: UserDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['put:user/role'] }
    };

    before(async () => {
      userModel = getModel<UserModel>(server.plugins, 'User');
    });
    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      user = await insertDummyUser(userModel);
      request = {
        method: 'PUT',
        url: `/users/${user._id}/roles`,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should update user roles to the given array', async () => {
      const role = await insertDummyRole(getModel(server.plugins, 'Role'));

      request.payload = [role._id];
      const response = await server.inject(request);
      const result = response.result as LeanUserDocument;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.roles)).to.be.true;
      expect(result.roles.length).to.equal(1);
      expect(result.roles[0]).to.be.a.string;
    });

    it('should update user roles to an empty array', async () => {
      request.payload = [];
      const response = await server.inject(request);
      const result = response.result as LeanUserDocument;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.roles)).to.be.true;
      expect(result.roles.length).to.equal(0);
    });

    it('should fail when the payload is not an array', async () => {
      request.payload = {};
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when the payload is empty', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when role Id is not a string', async () => {
      request.payload = [1];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when role Id is not of the required length', async () => {
      request.payload = ['abababababababababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when there are duplicate roles in the array', async () => {
      const role = await insertDummyRole(getModel(server.plugins, 'Role'));

      request.payload = [role._id, role._id];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when one of the roles does not exist', async () => {
      request.payload = ['abababababababababababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:role'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });
  });
});
