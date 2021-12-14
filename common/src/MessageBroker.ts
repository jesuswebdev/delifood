import { connect, NatsConnection, JSONCodec } from 'nats';

interface OnMessageHandler<T> {
  (msg: T): void;
}

interface ConstructorOptions {
  uri: string;
  channel: string;
  queue?: string;
}

class MessageBroker<T> {
  connection: NatsConnection | undefined;
  uri: string;
  channel: string;
  queue: string | undefined;
  onMessage: OnMessageHandler<T> | undefined;

  constructor(options: ConstructorOptions) {
    this.uri = options.uri;
    this.channel = options.channel;
    this.queue = options.queue;
  }

  async init() {
    try {
      this.connection = await connect({ servers: [this.uri] });
      console.log('Connection to NATS server established');
      return this;
    } catch (error) {
      throw new Error('Could not connect to NATS server');
    }
  }

  private encodeMessage(data: T) {
    const jc = JSONCodec<T>();

    return jc.encode(data);
  }

  private decodeMessage(msg: Uint8Array): T {
    const jc = JSONCodec<T>();

    return jc.decode(msg);
  }

  publish(data: T) {
    if (!this.connection) {
      throw new Error('NATS connection is not defined');
    }
    this.connection.publish(this.channel, this.encodeMessage(data));
  }

  async listen() {
    if (!this.connection) {
      throw new Error('NATS connection is not defined');
    }

    if (!this.onMessage) {
      throw new Error('OnMessage handler is not defined');
    }

    const sub = this.connection.subscribe(this.channel, {
      ...(this.queue && { queue: this.queue })
    });

    for await (const msg of sub) {
      const decoded = this.decodeMessage(msg.data);
      this.onMessage(decoded);
    }
  }
}

export { MessageBroker };
