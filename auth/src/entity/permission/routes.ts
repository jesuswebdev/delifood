'use strict';
import { Server } from '@hapi/hapi';
import Joi from 'joi';
import * as controller from './controller';

const PERMISSION_TYPES: string[] = [
  'create',
  'get',
  'list',
  'patch',
  'update',
  'delete'
];

const ROUTES_VALIDATION = {
  payload: {
    name: Joi.string().trim().min(4),
    value: Joi.string()
      .trim()
      //eslint-disable-next-line
      .regex(new RegExp(`^(${PERMISSION_TYPES.join('|')})\:[a-z\/]+`)),
    description: Joi.string().trim().min(4)
  },
  params: { id: Joi.string().trim().length(24).hex().required() },
  query: {}
};

const permissionRoutes = {
  name: 'permission routes',
  version: '1.0.0',
  async register(server: Server) {
    server.route({
      method: 'POST',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['create:permission'] },
        validate: {
          payload: Joi.object({
            name: ROUTES_VALIDATION.payload.name.required(),
            value: ROUTES_VALIDATION.payload.value.required(),
            description: ROUTES_VALIDATION.payload.description.optional()
          })
        }
      },
      handler: controller.createPermission
    });

    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['list:permission'] }
      },
      handler: controller.listPermissions
    });

    server.route({
      method: 'GET',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['get:permission'] },
        validate: {
          params: Joi.object({
            id: ROUTES_VALIDATION.params.id
          })
        }
      },
      handler: controller.getPermission
    });

    server.route({
      method: 'PATCH',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['patch:permission'] },
        validate: {
          payload: Joi.object({
            name: ROUTES_VALIDATION.payload.name.optional(),
            value: ROUTES_VALIDATION.payload.value.optional(),
            description: ROUTES_VALIDATION.payload.description.optional()
          }).or('name', 'value', 'description'),
          params: Joi.object({ id: ROUTES_VALIDATION.params.id })
        }
      },
      handler: controller.patchPermission
    });

    server.route({
      method: 'DELETE',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['delete:permission'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id })
        }
      },
      handler: controller.deletePermission
    });
  }
};

export { permissionRoutes };
