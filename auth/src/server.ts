import Hapi, { Server } from '@hapi/hapi';
import {
  tokenAuthStrategy,
  MongoosePlugin,
  NATSPlugin,
  UserCredentials as HapiUserCredentials
} from '@delifood/common';
import { HOST, PORT, MONGODB_URI, IRON_SECRET, NATS_URI } from './config/index';
import { mongoosePlugin } from './plugins/mongoose';
import { natsPlugin } from './plugins/nats';
import { authRoutesPlugin } from './plugins/user-auth-routes';
import { permissionRoutes } from './entity/permission/routes';
import { roleRoutes } from './entity/role/routes';
import { userRoutes } from './entity/user/routes';

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
    host: HOST,
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
    { plugin: permissionRoutes, routes: { prefix: '/permissions' } },
    { plugin: roleRoutes, routes: { prefix: '/roles' } },
    { plugin: userRoutes, routes: { prefix: '/users' } },
    { plugin: authRoutesPlugin, options: { ironSecret: IRON_SECRET } }
  ]);

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
