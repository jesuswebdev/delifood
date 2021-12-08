import amqp from 'amqplib';
import { Server } from '@hapi/hapi';
import { encodeRabbitMqMessage, QUEUE_CHANNELS } from '@delifood/common';

interface PluginRegisterOptions {
  uri: string;
}

const rabbitMqPlugin = {
  name: 'rabbitmq',
  version: '1.0.0',
  async register(server: Server, options: PluginRegisterOptions) {
    if (process.env.NODE_ENV === 'test') {
      //eslint-disable-next-line
      server.expose('publish', () => {});
      return;
    }

    const connection = await amqp.connect(options.uri, {});
    const channel = await connection.createChannel();
    await channel.assertExchange(QUEUE_CHANNELS.USER_CREATED, 'fanout');

    const publish = function publish<T>(queue: string, data: T) {
      channel.publish(queue, '', encodeRabbitMqMessage(data), {
        timestamp: Date.now()
      });
    };

    server.expose('publish', publish);
  }
};

export { rabbitMqPlugin };
