'use strict';
import { Server } from '@hapi/hapi';
import Joi from 'joi';
import { Types } from 'mongoose';
import * as controller from './controller';

const ROUTES_VALIDATION = {
  payload: {
    name: Joi.string().trim().min(4),
    description: Joi.string().trim().min(4)
  },
  params: {
    id: Joi.string()
      .trim()
      .custom((value: string, helpers: Joi.CustomHelpers<string>) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }

        return value;
      })
      .exist()
  },
  query: {}
};

const categoryRoutes = {
  name: 'category routes',
  version: '1.0.0',
  register(server: Server) {
    server.route({
      method: 'POST',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['create:category'] },
        validate: {
          payload: Joi.object({
            name: ROUTES_VALIDATION.payload.name.required(),
            description: ROUTES_VALIDATION.payload.description.optional()
          })
        }
      },
      handler: controller.createCategory
    });

    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['list:category'] }
      },
      handler: controller.listCategories
    });

    server.route({
      method: 'GET',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['get:category'] },
        validate: {
          params: Joi.object({
            id: ROUTES_VALIDATION.params.id
          })
        }
      },
      handler: controller.getCategory
    });

    server.route({
      method: 'PATCH',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['patch:category'] },
        validate: {
          payload: Joi.object({
            name: ROUTES_VALIDATION.payload.name.optional(),
            description: ROUTES_VALIDATION.payload.description.optional()
          }).or('name', 'description', 'enabled'),
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.patchCategory
    });

    server.route({
      method: 'DELETE',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['delete:category'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.deleteCategory
    });
  }
};

export { categoryRoutes };
