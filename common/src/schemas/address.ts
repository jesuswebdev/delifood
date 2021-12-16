import { Schema, SchemaOptions } from 'mongoose';
import { AddressAttributes } from '../interfaces/index';

const createAddressSchema = function createAddressSchema(
  options: SchemaOptions = {}
) {
  return new Schema<AddressAttributes>(
    {
      zipCode: { type: String, required: true },
      city: { type: String },
      phone: { type: String },
      company: { type: String },
      country: { type: String },
      default: { type: Boolean },
      address1: { type: String, required: true },
      address2: { type: String },
      province: { type: String },
      lastName: { type: String, required: true },
      firstName: { type: String, required: true },
      customerId: { type: Schema.Types.ObjectId, ref: 'CustomerProfile' },
      countryCode: { type: String },
      countryName: { type: String },
      provinceCode: { type: String }
    },
    { ...options }
  );
};

export { createAddressSchema };
