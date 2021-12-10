import { connect, NatsConnection } from 'nats';
import { Server } from '@hapi/hapi';
import { Model } from 'mongoose';
import {
  decodeNATSMessage,
  UserAttributes,
  QUEUE_CHANNELS,
  getModel,
  UserModel,
  ProductModel,
  ProductAttributes
} from '@delifood/common';

interface PluginRegisterOptions {
  uri: string;
}

interface ConsumerOptions {
  server: Server;
  connection: NatsConnection;
  channel: QUEUE_CHANNELS;
  model: string;
}

const startConsumer = async function startConsumer<T, P>({
  server,
  connection,
  channel,
  model: modelType
}: ConsumerOptions) {
  const sub = connection.subscribe(channel);
  const model: Model<T> = getModel(server.plugins, modelType);

  for await (const msg of sub) {
    const decoded = decodeNATSMessage<P>(msg.data);
    await model.create(decoded);
  }
};

const natsPlugin = {
  name: 'nats',
  version: '1.0.0',
  async register(server: Server, options: PluginRegisterOptions) {
    const connection = await connect({ servers: [options.uri] });

    await Promise.all([
      startConsumer<UserModel, UserAttributes>({
        server,
        connection,
        channel: QUEUE_CHANNELS.USER_CREATED,
        model: 'User'
      }),
      startConsumer<ProductModel, ProductAttributes>({
        server,
        connection,
        channel: QUEUE_CHANNELS.PRODUCT_CREATED,
        model: 'Product'
      })
    ]);

    if (process.env.NODE_ENV !== 'test') {
      console.log('Connection to NATS server established');
    }
  }
};

export { natsPlugin };
