'use strict';

import { Server, Request, ResponseToolkit } from '@hapi/hapi';
import Boom from '@hapi/boom';
import Iron from '@hapi/iron';

interface AuthStrategyOptions {
  ironSecret: string;
}

const tokenAuthStrategy = {
  name: 'authScheme',
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

    server.auth.scheme('requestScheme', requestScheme);
    server.auth.strategy('requestAuth', 'requestScheme');
    server.auth.default({ strategy: 'requestAuth' });
  }
};

export { tokenAuthStrategy };
