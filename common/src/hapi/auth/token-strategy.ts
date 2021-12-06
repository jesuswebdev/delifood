'use strict';

import { Server, Request, ResponseToolkit } from '@hapi/hapi';
import Boom from '@hapi/boom';
import Iron from '@hapi/iron';
import { AUTH_STRATEGY } from '../../index';

interface AuthStrategyOptions {
  ironSecret: string;
}

const tokenAuthStrategy = {
  name: 'tokenAuthScheme',
  register: async function (server: Server, options: AuthStrategyOptions) {
    const requestScheme = () => {
      return {
        authenticate: async (request: Request, h: ResponseToolkit) => {
          let token: string | null = null;
          let payload = null;
          const auth = request.raw.req.headers.authorization;

          if (!auth || !/^Bearer /.test(auth)) {
            return Boom.unauthorized();
          }

          try {
            token = auth.slice(7);
            payload = await Iron.unseal(
              token,
              options.ironSecret,
              Iron.defaults
            );
          } catch (error) {
            return Boom.unauthorized();
          }

          return h.authenticated({
            credentials: { scope: [].concat(payload.sub) }
          });
        }
      };
    };

    server.auth.scheme('tokenAuthScheme', requestScheme);
    server.auth.strategy(AUTH_STRATEGY.TOKEN_AUTH, 'tokenAuthScheme');
    server.auth.default({ strategy: AUTH_STRATEGY.TOKEN_AUTH });
  }
};

export { tokenAuthStrategy };
