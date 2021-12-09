import { Schema, SchemaOptions } from 'mongoose';
import { CategoryAttributes } from '../interfaces/index';

const createCategorySchema = function createCategorySchema(
  options: SchemaOptions = {}
) {
  return new Schema<CategoryAttributes>(
    {
      name: { type: String, required: true, unique: true },
      description: { type: String }
    },
    { ...options }
  );
};

export { createCategorySchema };
