'use strict';
import { Server } from '@hapi/hapi';
import Joi from 'joi';
import * as controller from './controller';

const ROUTES_VALIDATION = {
  payload: {
    name: Joi.string().trim().min(4),
    description: Joi.string().trim().min(0),
    sku: Joi.string().trim().min(4),
    price: Joi.number().integer().positive().min(0),
    enabled: Joi.boolean(),
    images: Joi.array().items(Joi.string().trim().uri()),
    discount: Joi.number().integer().positive().min(0),
    categories: Joi.array().items(Joi.string().hex().length(24)),
    tags: Joi.array().items(Joi.string().hex().length(24))
  },
  params: { id: Joi.string().hex().length(24).exist() },
  query: {}
};

const productRoutes = {
  name: 'product routes',
  version: '1.0.0',
  register: async function (server: Server) {
    server.route({
      method: 'POST',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['create:product'] },
        validate: {
          payload: Joi.object({
            name: ROUTES_VALIDATION.payload.name.required(),
            description: ROUTES_VALIDATION.payload.description.optional(),
            sku: ROUTES_VALIDATION.payload.sku.optional(),
            price: ROUTES_VALIDATION.payload.price.required(),
            enabled: ROUTES_VALIDATION.payload.enabled.optional(),
            images: ROUTES_VALIDATION.payload.images.optional(),
            discount: ROUTES_VALIDATION.payload.discount.optional(),
            categories: ROUTES_VALIDATION.payload.categories.optional(),
            tags: ROUTES_VALIDATION.payload.tags.optional()
          })
        }
      },
      handler: controller.createProduct
    });

    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['list:product'] }
      },
      handler: controller.listProducts
    });

    server.route({
      method: 'GET',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['get:product'] },
        validate: {
          params: Joi.object({
            id: ROUTES_VALIDATION.params.id
          })
        }
      },
      handler: controller.getProduct
    });

    server.route({
      method: 'PATCH',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['patch:product'] },
        validate: {
          payload: Joi.object({
            name: ROUTES_VALIDATION.payload.name.optional(),
            description: ROUTES_VALIDATION.payload.description.optional(),
            sku: ROUTES_VALIDATION.payload.sku.optional(),
            price: ROUTES_VALIDATION.payload.price.optional(),
            enabled: ROUTES_VALIDATION.payload.enabled.optional(),
            images: ROUTES_VALIDATION.payload.images.optional(),
            discount: ROUTES_VALIDATION.payload.discount.optional()
          }).or(
            ...Object.keys(ROUTES_VALIDATION.payload).filter(
              key => key !== 'tags' && key !== 'categories'
            )
          ),
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.patchProduct
    });

    server.route({
      method: 'DELETE',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['delete:product'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.deleteProduct
    });

    server.route({
      method: 'PUT',
      path: '/{id}/tags',
      options: {
        auth: { entity: 'user', scope: ['put:product/tags'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() }),
          payload: ROUTES_VALIDATION.payload.tags
        }
      },
      handler: controller.putProductTags
    });

    server.route({
      method: 'PUT',
      path: '/{id}/categories',
      options: {
        auth: { entity: 'user', scope: ['put:product/categories'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() }),
          payload: ROUTES_VALIDATION.payload.categories
        }
      },
      handler: controller.putProductCategories
    });
  }
};

export { productRoutes };
