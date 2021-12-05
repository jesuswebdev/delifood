export * from './permission';

export interface AuthToken {
  user?: string;
  issuedAt: number;
  expiresIn: number;
}
