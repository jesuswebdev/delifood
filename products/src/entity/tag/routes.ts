'use strict';
import { Server } from '@hapi/hapi';
import Joi from 'joi';
import * as controller from './controller';

const ROUTES_VALIDATION = {
  payload: {
    value: Joi.string()
      .trim()
      .pattern(new RegExp('[A-Za-z0-9\\s]+', 'i'))
      .min(4)
      .max(32)
  },
  params: { id: Joi.string().trim().length(24).hex().required() },
  query: {}
};

const tagRoutes = {
  name: 'tag routes',
  version: '1.0.0',
  register(server: Server) {
    server.route({
      method: 'POST',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['create:tag'] },
        validate: {
          payload: Joi.object({
            value: ROUTES_VALIDATION.payload.value.required()
          })
        }
      },
      handler: controller.createTag
    });

    server.route({
      method: 'GET',
      path: '/',
      options: {
        auth: { entity: 'user', scope: ['list:tag'] }
      },
      handler: controller.listTags
    });

    server.route({
      method: 'DELETE',
      path: '/{id}',
      options: {
        auth: { entity: 'user', scope: ['delete:tag'] },
        validate: {
          params: Joi.object({ id: ROUTES_VALIDATION.params.id })
        }
      },
      handler: controller.deleteTag
    });
  }
};

export { tagRoutes };
