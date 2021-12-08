import { createConnection } from 'mongoose';
import { Server } from '@hapi/hapi';
import { createPermissionModel } from '../entity/permission/model';
import { createRoleModel } from '../entity/role/model';
import { createUserModel } from '../entity/user/model';

interface PluginRegisterOptions {
  uri: string;
}

const mongoosePlugin = {
  name: 'mongoose',
  version: '1.0.0',
  async register(server: Server, options: PluginRegisterOptions) {
    const connection = await createConnection(options.uri).asPromise();
    createPermissionModel(connection);
    createRoleModel(connection);
    createUserModel(connection);
    server.expose('connection', connection);
    if (process.env.NODE_ENV !== 'test') {
      console.log('MongoDB database started');
    }
  }
};

export { mongoosePlugin };
