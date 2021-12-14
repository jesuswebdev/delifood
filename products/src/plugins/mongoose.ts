import { createConnection } from 'mongoose';
import { Server } from '@hapi/hapi';
import { createTagModel } from '../entity/tag/model';
import { createCategoryModel } from '../entity/category/model';
import { createProductModel } from '../entity/product/model';

interface PluginRegisterOptions {
  uri: string;
}

const mongoosePlugin = {
  name: 'mongoose',
  version: '1.0.0',
  async register(server: Server, options: PluginRegisterOptions) {
    const connection = await createConnection(options.uri).asPromise();
    createTagModel(connection);
    createCategoryModel(connection);
    createProductModel(connection);
    server.expose('connection', connection);

    if (process.env.NODE_ENV !== 'test') {
      console.log('MongoDB database started');
    }
  }
};

export { mongoosePlugin };
