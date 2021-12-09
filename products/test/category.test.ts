'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after, Done } from 'mocha';
import { expect } from 'chai';
import {
  getModel,
  cloneObject,
  AUTH_STRATEGY,
  CategoryModel,
  CategoryDocument,
  CategoryAttributes,
  LeanCategoryDocument
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

const cleanUp = async function cleanUp(server: Server) {
  const categoryModel = getModel<CategoryModel>(server.plugins, 'Category');
  await categoryModel.deleteMany();
};

async function insertDummyCategory(
  model: CategoryModel,
  text?: string
): Promise<CategoryDocument> {
  const p: CategoryDocument = await model.create({
    name: text ?? 'Dummy Category',
    description: 'Dummy category description'
  });
  return p;
}

describe('Test Category Routes', async () => {
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

  describe('Create Category', () => {
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['create:category'] }
    };

    beforeEach(done => {
      request = {
        method: 'POST',
        url: '/categories',
        payload: {
          name: 'New Category',
          description: 'a description'
        },
        auth: cloneObject(defaultAuthObject)
      };
      const model = getModel<CategoryModel>(server.plugins, 'Category');
      model
        .deleteMany()
        .exec()
        .then(() => done());
    });

    it('should create a category', async () => {
      const response = await server.inject(request);

      const result = response.result as CategoryDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.name).to.equal(
        (request.payload as CategoryAttributes).name
      );
      expect(result.description).to.equal(
        (request.payload as CategoryAttributes).description
      );
    });

    it('should create a category without description', async () => {
      (request.payload as CategoryAttributes).description = undefined;
      const response = await server.inject(request);
      const result = response.result as LeanCategoryDocument;
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
      request.auth.credentials.scope = ['save:category'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when the name is short', async () => {
      (request.payload as CategoryAttributes).name = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when description is short', async () => {
      (request.payload as CategoryAttributes).description = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate categories', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(201);
      const response_2 = await server.inject(request);
      expect(response_2.statusCode).to.equal(409);
    });
  });

  describe('Get Category', () => {
    let category: CategoryDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['get:category'] }
    };

    before(async () => {
      const model = getModel<CategoryModel>(server.plugins, 'Category');
      await cleanUp(server);
      category = await model.create({
        name: 'New Category',
        description: 'New Category description'
      });
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/categories/' + category._id,
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
      request.url = '/categories/aaaaaaaaaaaaaaaaaaaaaaaz';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when id is not present', async () => {
      request.url = '/categories/';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should return 404 when category does not exist', async () => {
      request.url = '/categories/aaaaaaaaaaaaaaaaaaaaaaa1';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should fail when scope is not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['list:category'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when user is not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials = {
        user: undefined,
        app: 'test',
        scope: ['get:category']
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should return the found category', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanCategoryDocument;
      expect(response.statusCode).to.equal(200);
      expect(result._id).to.exist;
      expect(result.name).to.exist;
      expect(result.description).to.exist;
    });
  });

  describe('List Categories', () => {
    let categoryModel: CategoryModel;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['list:category'] }
    };

    before(async () => {
      categoryModel = getModel<CategoryModel>(server.plugins, 'Category');
      await cleanUp(server);
      await insertDummyCategory(categoryModel);
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/categories',
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should return an array of categories', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanCategoryDocument[];
      expect(Array.isArray(result)).to.be.true;
      expect(result[0]._id).to.exist;
      expect(result[0].name).to.exist;
      expect(result[0].description).to.exist;
    });

    it('should return an empty array', async () => {
      await cleanUp(server);
      const response = await server.inject(request);
      const result = response.result as LeanCategoryDocument[];
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

  describe('Patch Category', () => {
    let categoryModel: CategoryModel;
    let category: CategoryDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['patch:category'] }
    };

    before(async () => {
      categoryModel = getModel<CategoryModel>(server.plugins, 'Category');
      await cleanUp(server);
      category = await insertDummyCategory(categoryModel);
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'PATCH',
        url: '/categories/' + category._id,
        payload: {
          name: 'patched name',
          description: 'patched description'
        },
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should patch a category', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a category name only', async () => {
      (request.payload as { name: string }) = {
        name: 'Patched name'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a category description only', async () => {
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
      (request.payload as CategoryAttributes).name = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when description is short', async () => {
      (request.payload as CategoryAttributes).description = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate categories', async () => {
      await categoryModel.create({
        name: 'New Category',
        description: 'New Category description'
      });
      (request.payload as CategoryAttributes).name = 'New Category';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(409);
    });

    it('should fail with error 404 when category does not exist / no rows affected by update query', async () => {
      request.url = '/categories/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('Delete Category', () => {
    let categoryModel: CategoryModel;
    let category: CategoryDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['delete:category'] }
    };

    before(async () => {
      categoryModel = getModel<CategoryModel>(server.plugins, 'Category');
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      category = await insertDummyCategory(categoryModel);
      request = {
        method: 'DELETE',
        url: '/categories/' + category._id,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should delete a category', async () => {
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

    it('should fail with error 404 when category does not exist / no rows affected by update query', async () => {
      request.url = '/categories/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });
});
