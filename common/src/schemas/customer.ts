import { Schema, SchemaOptions, Types } from 'mongoose';
import { CustomerAttributes } from '../interfaces/index';
import { USER_STATUS } from '../index';

const createCustomerSchema = function createCustomerSchema(
  options: SchemaOptions = {}
) {
  return new Schema<CustomerAttributes>(
    {
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true, select: false },
      status: { type: String, default: USER_STATUS.ACTIVE },
      roles: { type: [Types.ObjectId], ref: 'Role' },
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

export { createCustomerSchema };
