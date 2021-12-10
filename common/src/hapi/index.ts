import { Connection } from 'mongoose';
export * from './auth/token-strategy';

export interface NATSPlugin {
  publish: <T>(channel: string, data: T) => void;
}
export interface MongoosePlugin {
  connection: Connection;
}
