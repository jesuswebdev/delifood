import { Schema, SchemaOptions } from 'mongoose';
import { UserAttributes } from '../interfaces/index';

const createUserSchema = function createUserSchema(
  options: SchemaOptions = {}
) {
  return new Schema<UserAttributes>(
    {
      email: { type: String, required: true },
      password: { type: String, required: true },
      enabled: { type: Boolean, default: false },
      roles: { type: [Schema.Types.ObjectId], ref: 'Role' }
    },
    { ...options }
  );
};

export { createUserSchema };
