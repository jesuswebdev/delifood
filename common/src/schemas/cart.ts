import { Schema, SchemaOptions } from 'mongoose';
import { CartAttributes, CartItemAttributes } from '../interfaces/index';

const cartItemSubSchema = new Schema<CartItemAttributes>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number }
  },
  { _id: false, versionKey: false }
);

const createCartSchema = function createCartSchema(
  options: SchemaOptions = {}
) {
  return new Schema<CartAttributes>(
    {
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      items: { type: [cartItemSubSchema] }
    },
    { ...options }
  );
};

export { createCartSchema };
