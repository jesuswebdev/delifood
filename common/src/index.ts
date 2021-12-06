import { Types } from 'mongoose';

export const castToObjectId = function castToObjectId(
  value: string | Types.ObjectId
) {
  if (typeof value === 'string') {
    return new Types.ObjectId(value);
  }
  return value;
};

export const cloneObject = function cloneObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
};

export * from './interfaces/index';
export * from './schemas/index';
export * from './hapi/index';
