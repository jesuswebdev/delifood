import { Schema, SchemaOptions, Types } from 'mongoose';
import { ProductAttributes } from '../interfaces/index';

const createProductSchema = function createProductSchema(
  options: SchemaOptions = {}
) {
  return new Schema<ProductAttributes>(
    {
      name: { type: String, required: true },
      description: { type: String },
      discount: { type: Number, default: 0 },
      enabled: { type: Boolean, default: false },
      price: { type: Number },
      images: { type: [String] },
      rating: { type: Number },
      orders: { type: Number, default: 0 },
      sku: { type: String, unique: true },
      tags: { type: [Types.ObjectId], ref: 'Tag' },
      categories: { type: [Types.ObjectId], ref: 'Category' }
    },
    { ...options }
  );
};

export { createProductSchema };
