import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT ?? 8080;
export const MONGODB_URI = process.env.MONGODB_URI ?? '';
export const RABBITMQ_URI = process.env.RABBITMQ_URI ?? '';
export const IRON_SECRET = process.env.IRON_SECRET ?? '';
