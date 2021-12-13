'use strict';

import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ResponseValue
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import {
  getModel,
  MongoError,
  castToObjectId,
  ProductModel,
  CartItemAttributes,
  UserModel,
  CartModel,
  LeanCartDocument
} from '@delifood/common';

export async function addItemToCart(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const payload = request.payload as CartItemAttributes;
    const userModel = getModel<UserModel>(request.server.plugins, 'User');
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );
    const cartModel = getModel<CartModel>(request.server.plugins, 'Cart');

    if (!request.auth.credentials.user) {
      return Boom.forbidden();
    }

    const currentUserId = request.auth.credentials.user.id;

    const userExists = await userModel.exists({
      _id: castToObjectId(currentUserId)
    });

    if (!userExists) {
      return Boom.forbidden();
    }

    const productExists = await productModel.exists({
      _id: castToObjectId(payload.product as string)
    });

    if (!productExists) {
      return Boom.notFound('Product does not exist');
    }

    let saved: LeanCartDocument;

    const cartHasItem = await cartModel.exists({
      $and: [
        { user: castToObjectId(currentUserId) },
        { 'items.product': castToObjectId(payload.product as string) }
      ]
    });

    if (cartHasItem) {
      // item already exists in the cart, will update the quantity
      saved = await cartModel
        .findOneAndUpdate(
          {
            $and: [
              { user: castToObjectId(currentUserId) },
              { 'items.product': castToObjectId(payload.product as string) }
            ]
          },
          { $inc: { 'items.$.quantity': payload.quantity } },
          { new: true }
        )
        .select({ items: true, _id: false })
        .lean();
    } else {
      // creates the cart document if it does not exist
      saved = await cartModel
        .findOneAndUpdate(
          { user: castToObjectId(currentUserId) },
          {
            $push: {
              items: {
                product: castToObjectId(payload.product as string),
                quantity: payload.quantity
              }
            }
          },
          { upsert: true, new: true }
        )
        .select({ items: true, _id: false })
        .lean();
    }

    return h.response(saved).code(200);
  } catch (error: unknown) {
    console.error(error);

    if ((error as MongoError)?.code === 11000) {
      return Boom.conflict();
    }

    return Boom.internal();
  }
}

export async function getCart(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    if (!request.auth.credentials.user) {
      return Boom.unauthorized();
    }

    const userModel: UserModel = getModel(request.server.plugins, 'User');

    const currentUserId = request.auth.credentials.user.id;

    const userExists = await userModel.exists({
      _id: castToObjectId(currentUserId)
    });

    if (!userExists) {
      return Boom.forbidden();
    }

    const cartModel = getModel<CartModel>(request.server.plugins, 'Cart');
    const cart = await cartModel
      .findOne({ user: castToObjectId(currentUserId) })
      .select({ items: true, _id: false })
      .populate({ path: 'items.product' });

    if (!cart) {
      return { items: [] };
    }

    return h.response({ items: cart.items });
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function updateCartItem(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const payload = request.payload as CartItemAttributes;
    const userModel = getModel<UserModel>(request.server.plugins, 'User');
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );
    const cartModel = getModel<CartModel>(request.server.plugins, 'Cart');

    if (!request.auth.credentials.user) {
      return Boom.forbidden();
    }

    const currentUserId = request.auth.credentials.user.id;

    const userExists = await userModel.exists({
      _id: castToObjectId(currentUserId)
    });

    if (!userExists) {
      return Boom.forbidden();
    }

    const productId = request.params.id as string;

    const productExists = await productModel.exists({
      _id: castToObjectId(productId)
    });

    if (!productExists) {
      return Boom.notFound('Product does not exist');
    }

    let saved: LeanCartDocument;

    const cartHasItem = await cartModel.exists({
      $and: [
        { user: castToObjectId(currentUserId) },
        { 'items.product': castToObjectId(productId) }
      ]
    });

    if (cartHasItem) {
      // item already exists in the cart, will update the quantity
      saved = await cartModel
        .findOneAndUpdate(
          {
            $and: [
              { user: castToObjectId(currentUserId) },
              { 'items.product': castToObjectId(productId) }
            ]
          },
          { $set: { 'items.$.quantity': payload.quantity } },
          { new: true }
        )
        .select({ items: true, _id: false })
        .lean();
    } else {
      return Boom.notFound('The cart does not contain the provided item.');
    }

    return h.response(saved).code(200);
  } catch (error: unknown) {
    if ((error as MongoError)?.code === 11000) {
      return Boom.conflict();
    }

    return Boom.internal();
  }
}

export async function deleteCartItem(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const userModel = getModel<UserModel>(request.server.plugins, 'User');
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );
    const cartModel = getModel<CartModel>(request.server.plugins, 'Cart');

    if (!request.auth.credentials.user) {
      return Boom.forbidden();
    }

    const currentUserId = request.auth.credentials.user.id;

    const userExists = await userModel.exists({
      _id: castToObjectId(currentUserId)
    });

    if (!userExists) {
      return Boom.forbidden();
    }

    const productId = request.params.id as string;

    const productExists = await productModel.exists({
      _id: castToObjectId(productId)
    });

    if (!productExists) {
      return Boom.notFound('Product does not exist');
    }

    let saved: LeanCartDocument;

    const cartHasItem = await cartModel.exists({
      $and: [
        { user: castToObjectId(currentUserId) },
        { 'items.product': castToObjectId(productId) }
      ]
    });

    if (cartHasItem) {
      saved = await cartModel
        .findOneAndUpdate(
          { user: castToObjectId(currentUserId) },
          { $pull: { items: { product: castToObjectId(productId) } } },
          { new: true }
        )
        .select({ items: true, _id: false })
        .lean();
    } else {
      return Boom.notFound('The cart does not contain the provided item.');
    }

    return h.response(saved).code(200);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}
