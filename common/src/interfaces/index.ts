export * from './permission';
export * from './role';
export * from './user';

export * from './auth-strategy';
export * from './queue-channels';

export interface AuthToken {
  user?: string;
  issuedAt: number;
  expiresIn: number;
}

export interface MongoError {
  code: number;
}
