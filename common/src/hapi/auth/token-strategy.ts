'use strict';

import { Server, Request, ResponseToolkit } from '@hapi/hapi';
import Boom from '@hapi/boom';
import Iron from '@hapi/iron';
import { AUTH_STRATEGY, AuthToken } from '../../index';

interface AuthStrategyOptions {
  ironSecret: string;
}

const tokenAuthStrategy = {
  name: 'tokenAuthScheme',
  register(server: Server, options: AuthStrategyOptions) {
    const requestScheme = () => {
      return {
        authenticate: async (request: Request, h: ResponseToolkit) => {
          let token: string | null = null;
          const auth = request.raw.req.headers.authorization;

          if (!auth || !/^Bearer /.test(auth)) {
            return Boom.unauthorized();
          }

          try {
            token = auth.slice(7);
            const payload: AuthToken = await Iron.unseal(
              token,
              options.ironSecret,
              Iron.defaults
            );

            if (Date.now() > payload.expiresAt) {
              return h.unauthenticated(Error('Token expired'));
            }

            return h.authenticated({
              credentials: {
                user: payload.user,
                scope: payload.user.permissions
              }
            });
          } catch (error) {
            console.error(error);

            return Boom.unauthorized();
          }
        }
      };
    };

    server.auth.scheme('tokenAuthScheme', requestScheme);
    server.auth.strategy(AUTH_STRATEGY.TOKEN_AUTH, 'tokenAuthScheme');
    server.auth.default({ strategy: AUTH_STRATEGY.TOKEN_AUTH });
  }
};

export { tokenAuthStrategy };
