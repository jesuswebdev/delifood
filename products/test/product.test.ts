'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after, Done } from 'mocha';
import { expect } from 'chai';
import {
  cloneObject,
  AUTH_STRATEGY,
  ProductAttributes,
  ProductModel,
  getModel,
  ProductDocument,
  LeanProductDocument,
  CategoryModel,
  insertDummyCategory,
  insertDummyTag,
  insertDummyProduct,
  TagModel
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

const cleanUp = async function cleanUp(server: Server) {
  const productModel = getModel<ProductModel>(server.plugins, 'Product');
  const tagModel = getModel<TagModel>(server.plugins, 'Tag');
  const categoryModel = getModel<CategoryModel>(server.plugins, 'Category');
  await Promise.allSettled([
    productModel.deleteMany(),
    tagModel.deleteMany(),
    categoryModel.deleteMany()
  ]);
};

describe('Test Product Routes', () => {
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

  describe('Create Product', () => {
    let request: ServerInjectOptions & { payload: Partial<ProductAttributes> };
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['create:product'] }
    };

    beforeEach(async () => {
      await cleanUp(server);

      request = {
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'New Product',
          description: 'a product description',
          sku: 'asdf123',
          price: 1337,
          images: ['http://cats.com']
        },
        auth: cloneObject(defaultAuthObject)
      };
    });

    it('should create a product', async () => {
      const response = await server.inject(request);

      const result = response.result as ProductDocument;
      const payload = request.payload;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.name).to.equal(payload.name);
      expect(result.description).to.equal(payload.description);
      expect(result.sku).to.equal(payload.sku);
      expect(result.price).to.equal(payload.price);
      expect(Array.isArray(result.images)).to.be.true;
      expect((result.images ?? []).length).to.equal(1);
    });

    it('should create a product with discount', async () => {
      request.payload.discount = 10;
      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.discount).to.equal(request.payload.discount);
    });

    it('should create a product with categories', async () => {
      const category = await insertDummyCategory(
        getModel(server.plugins, 'Category')
      );

      request.payload.categories = [category._id.toString()];

      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(Array.isArray(result.categories)).to.be.true;
      expect(result.categories.length).to.equal(1);
      expect(result.categories[0]).to.be.a.string;
    });

    it('should create a product with tags', async () => {
      const tag = await insertDummyTag(getModel(server.plugins, 'Tag'));

      request.payload.tags = [tag._id.toString()];

      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(Array.isArray(result.tags)).to.be.true;
      expect(result.tags.length).to.equal(1);
      expect(result.tags[0]).to.be.a.string;
    });

    it('should create a product without description', async () => {
      request.payload.description = undefined;
      const response = await server.inject(request);
      const result = response.result as LeanProductDocument;
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
      request.payload.name = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate products', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(201);
      const response_2 = await server.inject(request);
      expect(response_2.statusCode).to.equal(409);
    });

    it('should not allow passing the rating property when creating a product', async () => {
      request.payload.rating = 1;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow passing the orders property when creating a product', async () => {
      request.payload.orders = 1;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow negative prices', async () => {
      request.payload.price = -1;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow prices with precision', async () => {
      request.payload.rating = 1.3;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when passing invalid image uri', async () => {
      request.payload.images = ['htt123123net'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when passing duplicate image uri', async () => {
      request.payload.images = ['http://cats.com', 'http://cats.com'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when passing negative discount', async () => {
      request.payload.discount = -10;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when passing discount with precision', async () => {
      request.payload.discount = 1.3;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when category id is not of the required length', async () => {
      request.payload.categories = ['ababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when creating a product with a non existant category', async () => {
      request.payload.categories = ['abababababababababababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when creating a product with duplicate categories', async () => {
      request.payload.images = [
        'abababababababababababab',
        'abababababababababababab'
      ];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when tag id is not of the required length', async () => {
      request.payload.tags = ['ababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when creating a product with a non existant tag', async () => {
      request.payload.tags = ['abababababababababababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when creating a product with duplicate tags', async () => {
      request.payload.tags = [
        'abababababababababababab',
        'abababababababababababab'
      ];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });
  });

  describe('Get Product', () => {
    let product: ProductDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['get:product'] }
    };

    before(async () => {
      await cleanUp(server);
      const model = getModel<ProductModel>(server.plugins, 'Product');

      const tag = await insertDummyTag(getModel(server.plugins, 'Tag'));
      const category = await insertDummyCategory(
        getModel(server.plugins, 'Category')
      );
      product = await insertDummyProduct(model, {
        name: 'New Product',
        description: 'a product description',
        sku: 'asdf123',
        price: 1337,
        images: ['http://cats.com'],
        categories: [category._id],
        tags: [tag._id]
      });
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/api/products/' + product._id,
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
      request.url = '/api/products/aaaaaaaaaaaaaaaaaaaaaaaz';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when id is not present', async () => {
      request.url = '/api/products/';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should return 404 when product does not exist', async () => {
      request.url = '/api/products/aaaaaaaaaaaaaaaaaaaaaaa1';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should fail when scope is not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['list:product'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when user is not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials = {
        user: undefined,
        app: 'test',
        scope: ['get:product']
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should return the found product', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanProductDocument;
      expect(response.statusCode).to.equal(200);
      expect(result._id).to.exist;
      expect(result.name).to.exist;
      expect(result.description).to.exist;
      expect(result.categories).to.exist;
      expect(result.tags).to.exist;
      expect(result.tags.length).to.equal(1);
      expect(result.categories.length).to.equal(1);
    });
  });

  describe('List Products', () => {
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['list:product'] }
    };

    before(async () => {
      await cleanUp(server);
      await insertDummyProduct(getModel(server.plugins, 'Product'));
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/api/products',
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should return an array of products', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanProductDocument[];
      expect(Array.isArray(result)).to.be.true;
      expect(result[0]._id).to.exist;
    });

    it('should return an empty array', async () => {
      await cleanUp(server);
      const response = await server.inject(request);
      const result = response.result as LeanProductDocument[];
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

    it('should not list disabled items', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });
  });

  describe('Patch Product', () => {
    let product: ProductDocument;
    let request: ServerInjectOptions & { payload: Partial<ProductAttributes> };
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['patch:product'] }
    };

    before(async () => {
      await cleanUp(server);
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      product = await insertDummyProduct(getModel(server.plugins, 'Product'));
      request = {
        method: 'PATCH',
        url: '/api/products/' + product._id,
        payload: {
          name: 'patched name'
        },
        auth: cloneObject(defaultAuthObject)
      };
    });

    it('should patch the name of the product', async () => {
      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;
      const payload = request.payload;

      expect(response.statusCode).to.equal(200);
      expect(result.name).to.equal(payload.name);
    });

    it('should patch the description of the product', async () => {
      request.payload.description = 'new description';
      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;
      const payload = request.payload;

      expect(response.statusCode).to.equal(200);
      expect(result.description).to.equal(payload.description);
    });

    it('should patch the description of the product to an empty string', async () => {
      request.payload.description = '';
      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;
      const payload = request.payload;

      expect(response.statusCode).to.equal(200);
      expect(result.description).to.equal(payload.description);
    });

    it('should patch the sku of the product', async () => {
      request.payload.sku = 'new sku';
      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;
      const payload = request.payload;

      expect(response.statusCode).to.equal(200);
      expect(result.sku).to.equal(payload.sku);
    });

    it('should patch the price of the product', async () => {
      request.payload.price = 1000;
      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;
      const payload = request.payload;

      expect(response.statusCode).to.equal(200);
      expect(result.price).to.equal(payload.price);
    });

    it('should patch the images of the product', async () => {
      request.payload.images = ['http://dogs.com'];
      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;
      const payload = request.payload;

      expect(response.statusCode).to.equal(200);
      expect((result.images ?? [])[0]).to.equal((payload.images ?? [])[0]);
    });

    it('should patch the discount of the product', async () => {
      request.payload.discount = 100;
      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;
      const payload = request.payload;

      expect(response.statusCode).to.equal(200);
      expect(result.discount).to.equal(payload.discount);
    });

    it('should disable the product', async () => {
      request.payload.enabled = false;
      const response = await server.inject(request);

      const result = response.result as LeanProductDocument;
      const payload = request.payload;

      expect(response.statusCode).to.equal(200);
      expect(result.enabled).to.equal(payload.enabled);
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

    it('should not allow duplicate products', async () => {
      await insertDummyProduct(getModel(server.plugins, 'Product'), {
        sku: 'qwe123'
      });
      request.payload.sku = 'qwe123';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(409);
    });

    it('should not allow passing the rating property when patching a product', async () => {
      request.payload.rating = 1;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow passing the orders property when patching a product', async () => {
      request.payload.orders = 1;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow negative prices', async () => {
      request.payload.price = -1;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow prices with precision', async () => {
      request.payload.rating = 1.3;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when passing invalid image uri', async () => {
      request.payload.images = ['htt123123net'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when passing duplicate image uri', async () => {
      request.payload.images = ['http://cats.com', 'http://cats.com'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when passing negative discount', async () => {
      request.payload.discount = -10;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when passing discount with precision', async () => {
      request.payload.discount = 1.3;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when trying to patch the categories', async () => {
      request.payload.categories = ['ababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when trying to patch the tags', async () => {
      request.payload.tags = ['ababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  describe('Delete Product', () => {
    let product: ProductDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['delete:product'] }
    };

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      product = await insertDummyProduct(getModel(server.plugins, 'Product'));
      request = {
        method: 'DELETE',
        url: '/api/products/' + product._id,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should delete a product', async () => {
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

    it('should fail with error 404 when product does not exist', async () => {
      request.url = '/api/products/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('Update Product Categories', () => {
    let product: ProductDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['put:product/categories'] }
    };

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      product = await insertDummyProduct(getModel(server.plugins, 'Product'));
      request = {
        method: 'PUT',
        url: `/api/products/${product._id}/categories`,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should update product categories to the given array', async () => {
      const category = await insertDummyCategory(
        getModel(server.plugins, 'Category')
      );

      request.payload = [category._id];
      const response = await server.inject(request);
      const result = response.result as LeanProductDocument;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.categories)).to.be.true;
      expect(result.categories.length).to.equal(1);
      expect(result.categories[0]).to.be.a.string;
    });

    it('should update product categories to an empty array', async () => {
      request.payload = [];
      const response = await server.inject(request);
      const result = response.result as LeanProductDocument;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.categories)).to.be.true;
      expect(result.categories.length).to.equal(0);
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

    it('should fail when category Id is not a string', async () => {
      request.payload = [1];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when category Id is not of the required length', async () => {
      request.payload = ['abababababababababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when there are duplicate categories in the array', async () => {
      const category = await insertDummyCategory(
        getModel(server.plugins, 'Category')
      );

      request.payload = [category._id, category._id];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when one of the categories does not exist', async () => {
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

  describe('Update Product Tags', () => {
    let productModel: ProductModel;
    let product: ProductDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['put:product/tags'] }
    };

    before(() => {
      productModel = getModel(server.plugins, 'Product');
    });
    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      product = await insertDummyProduct(productModel);
      request = {
        method: 'PUT',
        url: `/api/products/${product._id}/tags`,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should update product tags to the given array', async () => {
      const tag = await insertDummyTag(getModel(server.plugins, 'Tag'));

      request.payload = [tag._id];
      const response = await server.inject(request);
      const result = response.result as LeanProductDocument;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.tags)).to.be.true;
      expect(result.tags.length).to.equal(1);
      expect(result.tags[0]).to.be.a.string;
    });

    it('should update user roles to an empty array', async () => {
      request.payload = [];
      const response = await server.inject(request);
      const result = response.result as LeanProductDocument;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.tags)).to.be.true;
      expect(result.tags.length).to.equal(0);
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

    it('should fail when tag Id is not a string', async () => {
      request.payload = [1];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when tag Id is not of the required length', async () => {
      request.payload = ['abababababababababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when there are duplicate tags in the array', async () => {
      const tag = await insertDummyTag(getModel(server.plugins, 'Tag'));

      request.payload = [tag._id, tag._id];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when one of the tags does not exist', async () => {
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
