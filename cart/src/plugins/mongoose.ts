import { createConnection } from 'mongoose';
import { Server } from '@hapi/hapi';
import { createUserModel } from '../entity/user/model';
import { createProductModel } from '../entity/product/model';
import { createCartModel } from '../entity/cart/model';

interface PluginRegisterOptions {
  uri: string;
}

const mongoosePlugin = {
  name: 'mongoose',
  version: '1.0.0',
  async register(server: Server, options: PluginRegisterOptions) {
    const connection = await createConnection(options.uri).asPromise();
    createProductModel(connection);
    createUserModel(connection);
    createCartModel(connection);
    server.expose('connection', connection);
    if (process.env.NODE_ENV !== 'test') {
      console.log('MongoDB database started');
    }
  }
};

export { mongoosePlugin };
