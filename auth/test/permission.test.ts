'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after, Done } from 'mocha';
import { expect } from 'chai';
import {
  cloneObject,
  PermissionModel,
  PermissionAttributes,
  PermissionDocument,
  AUTH_STRATEGY,
  insertDummyPermission,
  getModel,
  LeanPermissionDocument
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

const cleanUp = async function cleanUp(server: Server) {
  const permissionModel = getModel<PermissionModel>(
    server.plugins,
    'Permission'
  );
  await permissionModel.deleteMany();
};

describe('Test Permission Routes', () => {
  let server: Server;
  let mongod: MongoMemoryServer;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    await init({ mongodbUri: mongod.getUri() }).then(s => {
      server = s;
    });
  });

  after(done => {
    server.stop();
    mongod.stop().then(() => {
      done();
    });
  });

  describe('Create Permission', () => {
    let request: ServerInjectOptions & {
      payload: Partial<PermissionAttributes>;
    };
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['create:permission'] }
    };

    beforeEach(async () => {
      await cleanUp(server);
      request = {
        method: 'POST',
        url: '/api/auth/permissions',
        payload: {
          name: 'New Permission',
          value: 'create:permission',
          description: 'a description'
        },
        auth: cloneObject(defaultAuthObject)
      };
    });

    it('should create a permission', async () => {
      const response = await server.inject(request);

      const result = response.result as PermissionDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.name).to.equal(request.payload.name);
      expect(result.value).to.equal(request.payload.value);
      expect(result.description).to.equal(request.payload.description);
    });

    it('should allow creating a permission with a slash (/)', async () => {
      request.payload.value = 'create:permission/new';
      const response = await server.inject(request);
      const result = response.result as PermissionDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.value).to.equal(request.payload.value);
    });

    it('should create a permission without description', async () => {
      request.payload.description = undefined;
      const response = await server.inject(request);
      const result = response.result as PermissionDocument;
      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.description).to.be.undefined;
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.app = {};
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when the name is short', async () => {
      request.payload.name = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when description is short', async () => {
      request.payload.description = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate permissions', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(201);
      const response_2 = await server.inject(request);
      expect(response_2.statusCode).to.equal(409);
    });

    it('should fail when permission value does not contain a semicolon (:)', async () => {
      request.payload.value = 'create/asdasd';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when permission value does not have text after semicolon (:)', async () => {
      request.payload.value = 'create:';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  describe('Get Permission', () => {
    let permission: PermissionDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['get:permission'] }
    };

    before(async () => {
      await cleanUp(server);
      permission = await insertDummyPermission(
        getModel(server.plugins, 'Permission')
      );
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/api/auth/permissions/' + permission._id,
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
      request.url = '/api/auth/permissions/aaaaaaaaaaaaaaaaaaaaaaaz';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when id is not present', async () => {
      request.url = '/api/auth/permissions/';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should return 404 when permission does not exist', async () => {
      request.url = '/api/auth/permissions/aaaaaaaaaaaaaaaaaaaaaaa1';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should fail when scope is not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['list:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when user is not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials = {
        user: undefined,
        app: 'test',
        scope: ['get:permission']
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should return the found permission', async () => {
      const response = await server.inject(request);
      const result = response.result as PermissionDocument;
      expect(response.statusCode).to.equal(200);
      expect(result._id).to.exist;
      expect(result.name).to.exist;
      expect(result.value).to.exist;
      expect(result.description).to.exist;
    });
  });

  describe('List Permissions', () => {
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['list:permission'] }
    };

    before(async () => {
      await cleanUp(server);
      await insertDummyPermission(getModel(server.plugins, 'Permission'));
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/api/auth/permissions',
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should return an array of permissions', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanPermissionDocument[];
      expect(Array.isArray(result)).to.be.true;
      expect(result[0]._id).to.exist;
      expect(result[0].name).to.exist;
      expect(result[0].value).to.exist;
      expect(result[0].description).to.exist;
    });

    it('should return an empty array', async () => {
      await cleanUp(server);
      const response = await server.inject(request);
      const result = response.result as PermissionDocument[];
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
      request.auth.credentials.scope = ['save:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });
  });

  describe('Patch Permission', () => {
    let permissionModel: PermissionModel;
    let permission: PermissionDocument;
    let request: ServerInjectOptions & {
      payload: Partial<PermissionAttributes>;
    };
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['patch:permission'] }
    };

    before(async () => {
      permissionModel = getModel(server.plugins, 'Permission');
      await cleanUp(server);
      permission = await insertDummyPermission(permissionModel);
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'PATCH',
        url: '/api/auth/permissions/' + permission._id,
        payload: {
          name: 'patched name',
          value: 'create:role'
        },
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should patch a permission', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a permission with a slash (/)', async () => {
      request.payload.value = 'create:permission/new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a permission name only', async () => {
      request.payload.name = 'Patched name';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a permission value only', async () => {
      request.payload.value = 'patch:permission/new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a permission description only', async () => {
      request.payload.description = 'Patched description';
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
      request.auth.credentials.scope = ['save:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when the name is short', async () => {
      request.payload.name = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when description is short', async () => {
      request.payload.description = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate permissions', async () => {
      await permissionModel.create({
        name: 'New Permission',
        value: 'delete:permission',
        description: 'New Permission description'
      });
      request.payload.value = 'delete:permission';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(409);
    });

    it('should fail when permission value does not contain a semicolon (:)', async () => {
      request.payload.value = 'create/asdasd';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when permission value does not have text after semicolon (:)', async () => {
      request.payload.value = 'create:';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail with error 404 when permission does not exist / no rows affected by update query', async () => {
      request.url = '/api/auth/permissions/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('Delete Permission', () => {
    let permission: PermissionDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['delete:permission'] }
    };

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      permission = await insertDummyPermission(
        getModel(server.plugins, 'Permission')
      );
      request = {
        method: 'DELETE',
        url: '/api/auth/permissions/' + permission._id,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should delete a permission', async () => {
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
      request.auth.credentials.scope = ['save:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail with error 404 when permission does not exist / no rows affected by update query', async () => {
      request.url = '/api/auth/permissions/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });
});
