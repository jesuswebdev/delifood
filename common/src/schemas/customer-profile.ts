import { Schema, SchemaOptions, Types } from 'mongoose';
import { CustomerProfileAttributes } from '../interfaces/index';

const createCustomerProfileSchema = function createCustomerProfileSchema(
  options: SchemaOptions = {}
) {
  return new Schema<CustomerProfileAttributes>(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      email: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      lastOrderId: { type: String },
      notes: { types: [String] },
      ordersCount: { type: Number },
      phone: { type: String },
      tags: { type: [String] },
      total_spent: { type: Number },
      addresses: { type: [Types.ObjectId], ref: 'Address' },
      defaultAddress: { type: Schema.Types.ObjectId, ref: 'Address' }
    },
    { ...options }
  );
};

export { createCustomerProfileSchema };
