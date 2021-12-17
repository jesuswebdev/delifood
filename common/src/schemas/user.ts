import { Schema, SchemaOptions, Types } from 'mongoose';
import { UserAttributes } from '../interfaces/index';
import { USER_STATUS } from '../index';

const createUserSchema = function createUserSchema(
  options: SchemaOptions = {}
) {
  return new Schema<UserAttributes>(
    {
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true, select: false },
      status: { type: String, default: USER_STATUS.ACTIVE },
      roles: { type: [Types.ObjectId], ref: 'Role' }
    },
    { ...options }
  );
};

export { createUserSchema };
