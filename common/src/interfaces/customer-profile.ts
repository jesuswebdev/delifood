import { Document, Model, LeanDocument, Types } from 'mongoose';
import { LeanUserDocument } from '.';
import { LeanAddressDocument } from './address';

export interface CustomerProfileAttributes {
  userId: Types.ObjectId | LeanUserDocument | string;
  email: string;
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

export interface CustomerProfileDocument
  extends Document,
    CustomerProfileAttributes {}

export interface LeanCustomerProfileDocument
  extends LeanDocument<CustomerProfileAttributes> {
  _id: string;
  __v: number;
}

// eslint-disable-next-line
export interface CustomerProfileModel extends Model<CustomerProfileDocument> {}
