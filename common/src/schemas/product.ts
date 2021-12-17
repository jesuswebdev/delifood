import { Schema, SchemaOptions, Types } from 'mongoose';
import { ProductAttributes } from '../interfaces/index';

const createProductSchema = function createProductSchema(
  options: SchemaOptions = {}
) {
  return new Schema<ProductAttributes>(
    {
      title: { type: String, required: true },
      description: { type: String },
      status: { type: String },
      discount: { type: Number, default: 0 },
      enabled: { type: Boolean, default: false },
      price: { type: Number },
      images: { type: [String] },
      rating: { type: Number },
      orders: { type: Number, default: 0 },
      sku: { type: String, unique: true },
      tags: { type: [String] },
      categories: { type: [Types.ObjectId], ref: 'Category' }
    },
    { ...options }
  );
};

export { createProductSchema };
