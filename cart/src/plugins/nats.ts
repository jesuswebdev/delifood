import { Server } from '@hapi/hapi';
import { Model } from 'mongoose';
import {
  QUEUE_CHANNELS,
  getModel,
  UserModel,
  ProductModel,
  MessageBroker,
  LeanUserDocument,
  LeanProductDocument
} from '@delifood/common';

interface PluginRegisterOptions {
  uri: string;
}

const natsPlugin = {
  name: 'nats',
  version: '1.0.0',
  async register(server: Server, options: PluginRegisterOptions) {
    if (process.env.NODE_ENV === 'test') {
      //eslint-disable-next-line
      server.expose('publish', () => {});

      return;
    }

    const userBroker = new MessageBroker<LeanUserDocument>({
      uri: options.uri,
      channel: QUEUE_CHANNELS.USER_CREATED
    });

    const productBroker = new MessageBroker<LeanProductDocument>({
      uri: options.uri,
      channel: QUEUE_CHANNELS.PRODUCT_CREATED
    });

    userBroker.onMessage = async msg => {
      const model: Model<UserModel> = getModel(server.plugins, 'User');
      await model.create(msg);
    };

    productBroker.onMessage = async msg => {
      const model: Model<ProductModel> = getModel(server.plugins, 'Product');
      await model.create(msg);
    };

    await userBroker.init().then(broker => broker.listen());
    await productBroker.init().then(broker => broker.listen());
  }
};

export { natsPlugin };
