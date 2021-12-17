export * from './permission';
export * from './role';
export * from './user';
export * from './category';
export * from './product';
export * from './tag';
export * from './cart';
export * from './cart-item';
export * from './address';
export * from './customer';

export interface UserCredentials {
  id: string;
  permissions?: string[];
  roles?: string[];
}
export interface AuthToken {
  user: UserCredentials;
  issuedAt: number;
  expiresAt: number;
}

export interface MongoError {
  code: number;
}
