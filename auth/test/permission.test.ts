'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after, Done } from 'mocha';
import { expect } from 'chai';
import {
  cloneObject,
  PermissionModel,
  PermissionAttributes,
  PermissionDocument,
  AUTH_STRATEGY
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';

function getPermissionModel(server: Server): PermissionModel {
  return server.plugins.mongoose.connection.model('Permission');
}
async function truncateCollection<T>(model: Model<T>): Promise<void> {
  await model.deleteMany();
  return;
}

async function insertDummyPermission(
  model: Model<PermissionDocument>,
  text?: string
): Promise<PermissionDocument> {
  const p: PermissionDocument = await model.create({
    name: `Dummy Permission${text ? ' ' + text : ''}`,
    value: 'create:permission',
    description: 'Dummy Permission description'
  });
  return p;
}

describe('Test Permission Routes', async () => {
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
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['create:permission'] }
    };

    beforeEach(done => {
      request = {
        method: 'POST',
        url: '/permissions',
        payload: {
          name: 'New Permission',
          value: 'create:permission',
          description: 'a description'
        },
        auth: cloneObject(defaultAuthObject)
      };
      const model = getPermissionModel(server);
      model
        .deleteMany()
        .exec()
        .then(() => done());
    });

    it('should create a permission', async () => {
      const response = await server.inject(request);

      const result = response.result as PermissionDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.name).to.equal(
        (request.payload as PermissionAttributes).name
      );
      expect(result.value).to.equal(
        (request.payload as PermissionAttributes).value
      );
      expect(result.description).to.equal(
        (request.payload as PermissionAttributes).description
      );
    });

    it('should allow creating a permission with a slash (/)', async () => {
      (request.payload as PermissionAttributes).value = 'create:permission/new';
      const response = await server.inject(request);

      const result = response.result as PermissionDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.value).to.equal(
        (request.payload as PermissionAttributes).value
      );
    });

    it('should create a permission without description', async () => {
      (request.payload as PermissionAttributes).description = undefined;
      const response = await server.inject(request);
      const result = response.result as PermissionDocument;
      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.description).to.be.undefined;
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
      (request.payload as PermissionAttributes).name = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when description is short', async () => {
      (request.payload as PermissionAttributes).description = 'new';
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
      (request.payload as PermissionAttributes).value = 'create/asdasd';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when permission value does not have text after semicolon (:)', async () => {
      (request.payload as PermissionAttributes).value = 'create:';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  describe('Get Permission', () => {
    let permission: PermissionDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['get:permission'] }
    };

    before(async () => {
      const model = getPermissionModel(server);
      await model.deleteMany();
      permission = await model.create({
        name: 'New Permission',
        value: 'create:permission',
        description: 'New Permission description'
      });
    });

    after(async () => {
      const model = getPermissionModel(server);
      await model.deleteMany();
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/permissions/' + permission._id,
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
      request.url = '/permissions/aaaaaaaaaaaaaaaaaaaaaaaz';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when id is not present', async () => {
      request.url = '/permissions/';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should return 404 when permission does not exist', async () => {
      request.url = '/permissions/aaaaaaaaaaaaaaaaaaaaaaa1';
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
    let PermissionModel: PermissionModel;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['list:permission'] }
    };

    before(async () => {
      PermissionModel = getPermissionModel(server);
      await truncateCollection(PermissionModel);
      await insertDummyPermission(PermissionModel);
    });

    after(async () => {
      await truncateCollection(PermissionModel);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/permissions',
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should return an array of permissions', async () => {
      const response = await server.inject(request);
      const result = response.result as PermissionDocument[];
      expect(Array.isArray(result)).to.be.true;
      expect(result[0]._id).to.exist;
      expect(result[0].name).to.exist;
      expect(result[0].value).to.exist;
      expect(result[0].description).to.exist;
    });

    it('should return an empty array', async () => {
      await truncateCollection(PermissionModel);
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
    let PermissionModel: PermissionModel;
    let permission: PermissionDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['patch:permission'] }
    };

    before(async () => {
      PermissionModel = getPermissionModel(server);
      await truncateCollection(PermissionModel);
      permission = await insertDummyPermission(PermissionModel);
    });

    after(async () => {
      await truncateCollection(PermissionModel);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'PATCH',
        url: '/permissions/' + permission._id,
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
      (request.payload as PermissionAttributes).value = 'create:permission/new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a permission name only', async () => {
      (request.payload as { name: string }) = {
        name: 'Patched name'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a permission value only', async () => {
      (request.payload as { value: string }) = {
        value: 'patch:permission/new'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a permission description only', async () => {
      (request.payload as { description: string }) = {
        description: 'Patched description'
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
      request.auth.credentials.scope = ['save:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when the name is short', async () => {
      (request.payload as PermissionAttributes).name = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when description is short', async () => {
      (request.payload as PermissionAttributes).description = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate permissions', async () => {
      await PermissionModel.create({
        name: 'New Permission',
        value: 'delete:permission',
        description: 'New Permission description'
      });
      (request.payload as PermissionAttributes).value = 'delete:permission';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(409);
    });

    it('should fail when permission value does not contain a semicolon (:)', async () => {
      (request.payload as PermissionAttributes).value = 'create/asdasd';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when permission value does not have text after semicolon (:)', async () => {
      (request.payload as PermissionAttributes).value = 'create:';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail with error 404 when permission does not exist / no rows affected by update query', async () => {
      request.url = '/permissions/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('Delete Permission', () => {
    let PermissionModel: PermissionModel;
    let permission: PermissionDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['delete:permission'] }
    };

    before(async () => {
      PermissionModel = getPermissionModel(server);
    });

    after(async () => {
      await truncateCollection(PermissionModel);
    });

    beforeEach(async () => {
      await truncateCollection(PermissionModel);
      permission = await insertDummyPermission(PermissionModel);
      request = {
        method: 'DELETE',
        url: '/permissions/' + permission._id,
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
      request.url = '/permissions/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });
});
