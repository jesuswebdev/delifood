import { Schema, SchemaOptions } from 'mongoose';
import { PermissionAttributes } from '../interfaces/index';

const createPermissionSchema = function createPermissionSchema(
  options: SchemaOptions = {}
) {
  return new Schema<PermissionAttributes>(
    {
      name: { type: String, required: true },
      description: { type: String },
      value: { type: String, required: true }
    },
    { ...options }
  );
};

export { createPermissionSchema };
