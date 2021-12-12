import dotenv from 'dotenv';
dotenv.config();

export const HOST = process.env.AUTH_SERVICE_HOST ?? '0.0.0.0';
export const PORT = process.env.AUTH_SERVICE_PORT ?? 8080;
export const MONGODB_URI =
  `mongodb://${process.env.AUTH_MONGO_SERVICE_HOST}:${process.env.AUTH_MONGO_SERVICE_PORT}/delifood-products` ??
  '';
export const NATS_URI =
  `http://${process.env.NATS_SERVICE_HOST}:${process.env.NATS_SERVICE_PORT}` ??
  '';
export const IRON_SECRET = process.env.IRON_SECRET ?? '';
