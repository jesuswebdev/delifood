import { Connection } from 'mongoose';
export * from './auth/token-strategy';

export interface RabbitMQPlugin {
  publish: <T>(channel: string, data: T) => void;
  sendToQueue: <T>(channel: string, data: T) => void;
}
export interface MongoosePlugin {
  connection: Connection;
}
