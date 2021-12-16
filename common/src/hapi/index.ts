import { Connection } from 'mongoose';
export * from './auth/token-strategy';

export interface MessageBrokerPlugin {
  publish: <T>(data: T) => void;
}
export interface MongoosePlugin {
  connection: Connection;
}
