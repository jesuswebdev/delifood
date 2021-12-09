import { Schema, SchemaOptions } from 'mongoose';
import { TagAttributes } from '../interfaces/index';

const createTagSchema = function createTagSchema(options: SchemaOptions = {}) {
  return new Schema<TagAttributes>(
    { value: { type: String, required: true, unique: true } },
    { ...options }
  );
};

export { createTagSchema };
