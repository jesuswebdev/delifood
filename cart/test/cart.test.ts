'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after } from 'mocha';
import { expect } from 'chai';
import {
  getModel,
  cloneObject,
  AUTH_STRATEGY,
  insertDummyProduct,
  insertDummyUser,
  CartModel,
  ProductModel,
  UserModel,
  UserDocument,
  CartAttributes,
  ProductDocument,
  CartItemAttributes,
  insertDummyCart
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

const cleanUp = async function cleanUp(server: Server) {
  const userModel = getModel<UserModel>(server.plugins, 'User');
  const productModel = getModel<ProductModel>(server.plugins, 'Product');
  const cartModel = getModel<CartModel>(server.plugins, 'Cart');
  await Promise.allSettled([
    userModel.deleteMany(),
    productModel.deleteMany(),
    cartModel.deleteMany()
  ]);
};

describe('Test Cart Routes', () => {
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

  describe('Add item to cart', () => {
    let request: ServerInjectOptions & { payload: Partial<CartItemAttributes> };
    let product: ProductDocument;
    let user: UserDocument;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: '123' }, scope: ['create:cart/item'] }
    };

    beforeEach(async () => {
      await cleanUp(server);
      user = await insertDummyUser(getModel(server.plugins, 'User'));
      product = await insertDummyProduct(getModel(server.plugins, 'Product'));

      request = {
        method: 'POST',
        url: '/api/cart/item',
        payload: {
          product: product.id,
          quantity: 3
        },
        auth: cloneObject({
          ...defaultAuthObject,
          credentials: {
            ...defaultAuthObject.credentials,
            user: { id: user._id }
          }
        })
      };
    });

    it('should create cart and add item to it', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(200);
      const result = response.result as CartAttributes;
      expect(Array.isArray(result.items)).to.be.true;
      expect(result.items.length).to.eq(1);
      expect(result.items[0].product.toString()).to.eq(product.id);
      expect(result.items[0].quantity).to.eq(3);
    });

    it('should add item to existing cart', async () => {
      const cartModel: CartModel = getModel(server.plugins, 'Cart');
      await cartModel.create({ user: user._id });

      const response = await server.inject(request);
      expect(response.statusCode).to.eq(200);
      const result = response.result as CartAttributes;
      expect(Array.isArray(result.items)).to.be.true;
      expect(result.items.length).to.eq(1);
      expect(result.items[0].product.toString()).to.eq(product.id);
      expect(result.items[0].quantity).to.eq(3);
    });

    it('should fail when there are no user credentials', async () => {
      request.auth = cloneObject(defaultAuthObject);
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(403);
    });

    it('should fail when the user does not exist', async () => {
      request.auth = cloneObject({
        ...defaultAuthObject,
        credentials: {
          ...defaultAuthObject.credentials,
          user: { id: '61b3a085830262ca83ce091d' }
        }
      });
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(403);
    });

    it('should fail when the product does not exist', async () => {
      request.payload.product = '61b3a085830262ca83ce091d';
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(404);
    });

    it('adding an item that already exists in the cart should sum the quantities', async () => {
      await server.inject(request);
      await server.inject(request);

      const newProduct = await insertDummyProduct(
        getModel(server.plugins, 'Product'),
        { name: 'new product', sku: 'wat1337' }
      );

      request.payload.product = newProduct._id;
      request.payload.quantity = 10;
      const response = await server.inject(request);
      const result = response.result as CartAttributes;
      expect(response.statusCode).to.eq(200);
      expect(Array.isArray(result.items)).to.be.true;
      expect(result.items.length).to.eq(2);
      expect(result.items[0].quantity).to.eq(6);
      expect(result.items[1].quantity).to.eq(10);
    });

    it('should fail when quantity is 0', async () => {
      request.payload.quantity = 0;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });

    it('should fail when quantity is negative', async () => {
      request.payload.quantity = -13;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });

    it('should fail when quantity has precision point', async () => {
      request.payload.quantity = 1.3;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });

    it('should fail when quantity is a string', async () => {
      (request.payload as { quantity: unknown }).quantity = 'uno';
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });
  });

  describe('Get Cart', () => {
    let user: UserDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: '123' }, scope: ['get:cart'] }
    };

    before(async () => {
      await cleanUp(server);

      user = await insertDummyUser(getModel(server.plugins, 'User'));
      const product = await insertDummyProduct(
        getModel(server.plugins, 'Product')
      );

      const cartModel = getModel<CartModel>(server.plugins, 'Cart');

      await cartModel.create({
        user: user._id,
        items: [{ product: product._id, quantity: 5 }]
      });
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(() => {
      request = {
        method: 'GET',
        url: '/api/cart',
        auth: cloneObject({
          ...defaultAuthObject,
          credentials: { user: { id: user._id }, scope: ['get:cart'] }
        })
      };
    });

    it('should return the cart', async () => {
      const response = await server.inject(request);
      const result = response.result as CartAttributes;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.items)).to.be.true;
      expect(result.items.length).to.eq(1);
      expect(result.items[0].quantity).to.eq(5);
    });

    it('should fail when there are no user credentials', async () => {
      request.auth = cloneObject(defaultAuthObject);
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(403);
    });

    it('should fail when the user does not exist', async () => {
      request.auth = cloneObject({
        ...defaultAuthObject,
        credentials: {
          ...defaultAuthObject.credentials,
          user: { id: '61b3a085830262ca83ce091d' }
        }
      });
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(403);
    });

    it('should return an empty cart if it does not exist yet', async () => {
      await getModel<CartModel>(server.plugins, 'Cart').deleteMany();
      const response = await server.inject(request);
      const result = response.result as CartAttributes;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.items)).to.be.true;
      expect(result.items.length).to.eq(0);
    });
  });

  describe('Patch Cart item', () => {
    let request: ServerInjectOptions & { payload: Partial<CartItemAttributes> };
    let product: ProductDocument;
    let user: UserDocument;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: '123' }, scope: ['patch:cart/item'] }
    };

    beforeEach(async () => {
      await cleanUp(server);
      user = await insertDummyUser(getModel(server.plugins, 'User'));
      product = await insertDummyProduct(getModel(server.plugins, 'Product'));
      await insertDummyCart(getModel(server.plugins, 'Cart'), {
        user: user._id,
        items: [{ product: product._id, quantity: 1 }]
      });

      request = {
        method: 'PATCH',
        url: '/api/cart/item/' + product.id,
        payload: {
          quantity: 5
        },
        auth: cloneObject({
          ...defaultAuthObject,
          credentials: {
            ...defaultAuthObject.credentials,
            user: { id: user._id }
          }
        })
      };
    });

    it('should patch the item quantity', async () => {
      const response = await server.inject(request);
      const result = response.result as CartAttributes;
      expect(response.statusCode).to.eq(200);
      expect(Array.isArray(result.items)).to.be.true;
      expect(result.items.length).to.eq(1);
      expect(result.items[0].quantity).to.eq(5);
    });

    it('should fail when the cart does not exist / item is not in the cart', async () => {
      await getModel<CartModel>(server.plugins, 'Cart').deleteMany();
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should not allow patching the product id', async () => {
      request.payload.product = '61b3a085830262ca83ce091d';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when there are no user credentials', async () => {
      request.auth = cloneObject(defaultAuthObject);
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(403);
    });

    it('should fail when the user does not exist', async () => {
      request.auth = cloneObject({
        ...defaultAuthObject,
        credentials: {
          ...defaultAuthObject.credentials,
          user: { id: '61b3a085830262ca83ce091d' }
        }
      });
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(403);
    });

    it('should fail when the product does not exist', async () => {
      request.url = '/api/cart/item/61b3a085830262ca83ce091d';
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(404);
    });

    it('should fail when the product id does not match the required length', async () => {
      request.payload.product = '61b3a085830262ca83ce091';
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });

    it('should fail when the product id is not valid', async () => {
      request.payload.product = 'abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });

    it('should fail when quantity is 0', async () => {
      request.payload.quantity = 0;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });

    it('should fail when quantity is negative', async () => {
      request.payload.quantity = -13;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });

    it('should fail when quantity has precision point', async () => {
      request.payload.quantity = 1.3;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });

    it('should fail when quantity is a string', async () => {
      (request.payload as { quantity: unknown }).quantity = 'uno';
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });
  });

  describe('Delete Cart item', () => {
    let request: ServerInjectOptions;
    let product: ProductDocument;
    let user: UserDocument;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: '123' }, scope: ['delete:cart/item'] }
    };

    beforeEach(async () => {
      await cleanUp(server);
      user = await insertDummyUser(getModel(server.plugins, 'User'));
      product = await insertDummyProduct(getModel(server.plugins, 'Product'));
      await insertDummyCart(getModel(server.plugins, 'Cart'), {
        user: user._id,
        items: [{ product: product._id, quantity: 1 }]
      });

      request = {
        method: 'DELETE',
        url: '/api/cart/item/' + product.id,
        auth: cloneObject({
          ...defaultAuthObject,
          credentials: {
            ...defaultAuthObject.credentials,
            user: { id: user._id }
          }
        })
      };
    });

    it('should delete the item', async () => {
      const response = await server.inject(request);
      const result = response.result as CartAttributes;
      expect(response.statusCode).to.eq(200);
      expect(Array.isArray(result.items)).to.be.true;
      expect(result.items.length).to.eq(0);
    });

    it('should fail when the cart does not exist / item is not in the cart', async () => {
      await getModel<CartModel>(server.plugins, 'Cart').deleteMany();
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should fail when there are no user credentials', async () => {
      request.auth = cloneObject(defaultAuthObject);
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(403);
    });

    it('should fail when the user does not exist', async () => {
      request.auth = cloneObject({
        ...defaultAuthObject,
        credentials: {
          ...defaultAuthObject.credentials,
          user: { id: '61b3a085830262ca83ce091d' }
        }
      });
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(403);
    });

    it('should fail when the product does not exist', async () => {
      request.url = '/api/cart/item/61b3a085830262ca83ce091d';
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(404);
    });

    it('should fail when the product id does not match the required length', async () => {
      request.url = '/api/cart/item/61b3a085830262ca83ce091';
      const response = await server.inject(request);
      expect(response.statusCode).to.eq(400);
    });
  });
});
