import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT ?? 8080;
export const MONGODB_URI = process.env.MONGODB_URI ?? '';
export const NATS_URI = process.env.NATS_URI ?? '';
export const IRON_SECRET = process.env.IRON_SECRET ?? '';
