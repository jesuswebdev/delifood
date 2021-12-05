import { Types } from 'mongoose';

export const castToObjectId = function castToObjectId(
  value: string | Types.ObjectId
) {
  if (typeof value === 'string') {
    return new Types.ObjectId(value);
  }
  return value;
};

export * from './interfaces/index';
export * from './schemas/index';
export * from './hapi/index';
