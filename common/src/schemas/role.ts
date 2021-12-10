import { Schema, SchemaOptions, Types } from 'mongoose';
import { RoleAttributes } from '../interfaces/role';

const createRoleSchema = function createRoleSchema(
  options: SchemaOptions = {}
) {
  return new Schema<RoleAttributes>(
    {
      name: { type: String, required: true, unique: true },
      description: { type: String },
      permissions: { type: [Types.ObjectId], ref: 'Permission' }
    },
    { ...options }
  );
};

export { createRoleSchema };
