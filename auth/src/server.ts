import Hapi, { ResponseToolkit, Server, Request } from '@hapi/hapi';
import {
  tokenAuthStrategy,
  MongoosePlugin,
  NATSPlugin,
  UserCredentials as HapiUserCredentials
} from '@delifood/common';
import { PORT, MONGODB_URI, IRON_SECRET, NATS_URI } from './config/index';
import { mongoosePlugin } from './plugins/mongoose';
import { natsPlugin } from './plugins/nats';
import { authRoutesPlugin } from './plugins/user-auth-routes';
import { permissionRoutes } from './entity/permission/routes';
import { roleRoutes } from './entity/role/routes';
import { userRoutes } from './entity/user/routes';

console.log('======ENV VARIABLES=====');
console.log('PORT', PORT);
console.log('MONGODB_URI', MONGODB_URI);
console.log('NATS_URI', NATS_URI);
console.log('IRON_SECRET', IRON_SECRET);
declare module '@hapi/hapi' {
  export interface PluginProperties {
    // eslint-disable-next-line
    [key: string]: any;
    mongoose: MongoosePlugin;
    nats: NATSPlugin;
  }
  // eslint-disable-next-line
  export interface UserCredentials extends HapiUserCredentials {}
}

let server: Server;

interface InitServerConfig {
  mongodbUri: string;
}

export const init = async function init(config?: InitServerConfig) {
  server = Hapi.server({
    host: '0.0.0.0',
    port: PORT,
    routes: { cors: true }
  });

  await server.register([
    {
      plugin: mongoosePlugin,
      options: { uri: config?.mongodbUri ?? MONGODB_URI }
    },
    { plugin: natsPlugin, options: { uri: NATS_URI } },
    { plugin: tokenAuthStrategy, options: { ironSecret: IRON_SECRET } },
    { plugin: permissionRoutes, routes: { prefix: '/api/auth/permissions' } },
    { plugin: roleRoutes, routes: { prefix: '/api/auth/roles' } },
    { plugin: userRoutes, routes: { prefix: '/api/auth/users' } },
    {
      plugin: authRoutesPlugin,
      options: { ironSecret: IRON_SECRET },
      routes: { prefix: '/api/auth' }
    }
  ]);

  server.route({
    method: 'GET',
    path: '/api/auth/health',
    options: { auth: false },
    async handler(request: Request, h: ResponseToolkit) {
      const mongoose = request.server.plugins.mongoose.connection;
      return h.response({ api: true, db: mongoose.readyState === 1 });
    }
  });

  return server;
};

export const start = function start() {
  console.log('Listening on port', PORT);
  return server.start();
};

process.on('unhandledRejection', error => {
  console.error(error);
  process.exit(1);
});
