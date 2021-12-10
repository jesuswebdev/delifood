import Hapi, { Server } from '@hapi/hapi';
import {
  tokenAuthStrategy,
  MongoosePlugin,
  NATSPlugin,
  UserCredentials as HapiUserCredentials
} from '@delifood/common';
import { PORT, MONGODB_URI, IRON_SECRET, NATS_URI } from './config/index';
import { mongoosePlugin } from './plugins/mongoose';
import { natsPlugin } from './plugins/nats';
import tagsRoutes from './entity/tag/routes';
import categoriesRoutes from './entity/category/routes';
import productRoutes from './entity/product/routes';

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
  server = Hapi.server({ host: 'localhost', port: PORT });

  await server.register([
    {
      plugin: mongoosePlugin,
      options: { uri: config?.mongodbUri ?? MONGODB_URI }
    },
    { plugin: natsPlugin, options: { uri: NATS_URI } },
    { plugin: tokenAuthStrategy, options: { ironSecret: IRON_SECRET } },
    { plugin: tagsRoutes, routes: { prefix: '/tags' } },
    { plugin: categoriesRoutes, routes: { prefix: '/categories' } },
    { plugin: productRoutes, routes: { prefix: '/products' } }
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
