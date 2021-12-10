import { connect } from 'nats';
import { Server } from '@hapi/hapi';
import { encodeNATSMessage, QUEUE_CHANNELS } from '@delifood/common';

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

    const connection = await connect({ servers: [options.uri] });

    const publish = function publish<T>(channel: QUEUE_CHANNELS, data: T) {
      connection.publish(channel, encodeNATSMessage(data));
    };

    server.expose('publish', publish);
    console.log('Connection to NATS server established');
  }
};

export { natsPlugin };
