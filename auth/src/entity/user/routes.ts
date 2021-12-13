'use strict';
import { Server } from '@hapi/hapi';
import Joi from 'joi';
import * as controller from './controller';

const ROUTES_VALIDATION = {
  payload: {
    email: Joi.string().trim().email(),
    password: Joi.string().trim().min(8),
    enabled: Joi.boolean(),
    roles: Joi.array().items(Joi.string().hex().length(24))
  },
  params: { id: Joi.string().hex().length(24).exist() },
  query: {}
};

const userRoutes = {
  name: 'users routes',
  version: '1.0.0',
  register(server: Server) {
    server.route({
      method: 'POST',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['create:user'] },
        validate: {
          payload: Joi.object({
            email: ROUTES_VALIDATION.payload.email.required(),
            password: ROUTES_VALIDATION.payload.password.required(),
            enabled: ROUTES_VALIDATION.payload.enabled.optional()
          })
        }
      },
      handler: controller.createUser
    });

    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['list:user'] }
      },
      handler: controller.listUsers
    });

    server.route({
      method: 'GET',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['get:user'] },
        validate: {
          params: Joi.object({
            id: ROUTES_VALIDATION.params.id
          })
        }
      },
      handler: controller.getUser
    });

    server.route({
      method: 'PATCH',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['patch:user'] },
        validate: {
          payload: Joi.object({
            email: ROUTES_VALIDATION.payload.email.optional(),
            password: ROUTES_VALIDATION.payload.password.optional(),
            enabled: ROUTES_VALIDATION.payload.enabled.optional()
          }).or('email', 'password', 'enabled'),
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.patchUser
    });

    server.route({
      method: 'DELETE',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['delete:user'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.deleteUser
    });

    server.route({
      method: 'PUT',
      path: '/{id}/roles',
      options: {
        auth: { entity: 'user', scope: ['put:user/role'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() }),
          payload: ROUTES_VALIDATION.payload.roles
        }
      },
      handler: controller.putUserRoles
    });
  }
};

export { userRoutes };
