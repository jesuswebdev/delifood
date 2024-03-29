import Hapi, { Server, Request, ResponseToolkit } from '@hapi/hapi';
import {
  tokenAuthStrategy,
  MongoosePlugin,
  NATSPlugin,
  UserCredentials as HapiUserCredentials
} from '@delifood/common';
import { PORT, MONGODB_URI, IRON_SECRET, NATS_URI } from './config/index';
import { mongoosePlugin } from './plugins/mongoose';
import { natsPlugin } from './plugins/nats';
import { tagRoutes } from './entity/tag/routes';
import { categoryRoutes } from './entity/category/routes';
import { productRoutes } from './entity/product/routes';

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
  server = Hapi.server({ host: '0.0.0.0', port: PORT, routes: { cors: true } });

  await server.register([
    {
      plugin: mongoosePlugin,
      options: { uri: config?.mongodbUri ?? MONGODB_URI }
    },
    { plugin: natsPlugin, options: { uri: NATS_URI } },
    { plugin: tokenAuthStrategy, options: { ironSecret: IRON_SECRET } },
    { plugin: tagRoutes, routes: { prefix: '/api/products/tags' } },
    {
      plugin: categoryRoutes,
      routes: { prefix: '/api/products/categories' }
    },
    { plugin: productRoutes, routes: { prefix: '/api/products' } }
  ]);

  server.route({
    method: 'GET',
    path: '/api/products/health',
    options: { auth: false },
    handler(request: Request, h: ResponseToolkit) {
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
