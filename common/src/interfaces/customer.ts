import { Document, Model, LeanDocument, Types } from 'mongoose';
import { UserAttributes } from '.';
import { LeanAddressDocument } from './address';

export interface CustomerAttributes extends UserAttributes {
  firstName: string;
  lastName: string;
  lastOrderId: string;
  notes: string[];
  ordersCount: number;
  phone: string;
  tags: string[];
  total_spent: number;
  addresses: Types.ObjectId[] | LeanAddressDocument[] | string[];
  defaultAddress: Types.ObjectId | LeanAddressDocument | string;
}

export interface CustomerDocument extends Document, CustomerAttributes {}

export interface LeanCustomerDocument extends LeanDocument<CustomerAttributes> {
  _id: string;
  __v: number;
}

// eslint-disable-next-line
export interface CustomerProfileModel extends Model<CustomerDocument> {}
