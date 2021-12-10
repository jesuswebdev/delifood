'use strict';
import { Server } from '@hapi/hapi';
import Joi from 'joi';
import * as controller from './controller';

const ROUTES_VALIDATION = {
  payload: {
    name: Joi.string().trim().min(4),
    description: Joi.string().trim().min(4),
    permissions: Joi.array().items(Joi.string().hex().length(24))
  },
  params: { id: Joi.string().hex().length(24).exist() },
  query: {}
};

const roleRoutes = {
  name: 'roles routes',
  version: '1.0.0',
  register: async function (server: Server) {
    server.route({
      method: 'POST',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['create:role'] },
        validate: {
          payload: Joi.object({
            name: ROUTES_VALIDATION.payload.name.required(),
            description: ROUTES_VALIDATION.payload.description.optional()
          })
        }
      },
      handler: controller.createRole
    });

    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['list:role'] }
      },
      handler: controller.listRoles
    });

    server.route({
      method: 'GET',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['get:role'] },
        validate: {
          params: Joi.object({
            id: ROUTES_VALIDATION.params.id
          })
        }
      },
      handler: controller.getRole
    });

    server.route({
      method: 'PATCH',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['patch:role'] },
        validate: {
          payload: Joi.object({
            name: ROUTES_VALIDATION.payload.name.optional(),
            description: ROUTES_VALIDATION.payload.description.optional()
          }).or('name', 'description', 'enabled'),
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.patchRole
    });

    server.route({
      method: 'DELETE',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['delete:role'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() })
        }
      },
      handler: controller.deleteRole
    });

    server.route({
      method: 'PUT',
      path: '/{id}/permissions',
      options: {
        auth: { entity: 'user', scope: ['put:role/permission'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id.required() }),
          payload: ROUTES_VALIDATION.payload.permissions
        }
      },
      handler: controller.putRolePermissions
    });
  }
};

export { roleRoutes };
