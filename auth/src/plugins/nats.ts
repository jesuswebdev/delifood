import { Server } from '@hapi/hapi';
import { QUEUE_CHANNELS, MessageBroker } from '@delifood/common';

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

    const broker = new MessageBroker({
      uri: options.uri,
      channel: QUEUE_CHANNELS.USER_CREATED
    });

    await broker.init();
    server.expose('publish', broker.publish.bind(broker));
  }
};

export { natsPlugin };
