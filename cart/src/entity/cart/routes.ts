'use strict';
import { Server } from '@hapi/hapi';
import Joi from 'joi';
import * as controller from './controller';

const ROUTES_VALIDATION = {
  payload: {
    product: Joi.string().hex().length(24),
    quantity: Joi.number().integer().positive().min(1)
  },
  params: { id: Joi.string().hex().length(24).exist() },
  query: {}
};

export default {
  name: 'cart routes',
  version: '1.0.0',
  register(server: Server) {
    server.route({
      method: 'POST',
      path: '/item',
      options: {
        auth: { entity: 'user', scope: ['create:cart/item'] },
        validate: {
          payload: Joi.object({
            product: ROUTES_VALIDATION.payload.product.required(),
            quantity: ROUTES_VALIDATION.payload.quantity.required()
          })
        }
      },
      handler: controller.addItemToCart
    });

    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['get:cart'] }
      },
      handler: controller.getCart
    });

    server.route({
      method: 'PATCH',
      path: '/item/{id}',
      options: {
        auth: { entity: 'user', scope: ['patch:cart/item'] },
        validate: {
          payload: Joi.object({
            quantity: ROUTES_VALIDATION.payload.quantity.required()
          }),
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.updateCartItem
    });

    server.route({
      method: 'DELETE',
      path: '/item/{id}',
      options: {
        auth: { entity: 'user', scope: ['delete:cart/item'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.deleteCartItem
    });
  }
};
