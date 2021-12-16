import { Document, Model, LeanDocument, Types } from 'mongoose';

export interface AddressAttributes {
  zipCode: string;
  city: string;
  phone: string;
  company: string | null;
  country: string;
  default: boolean;
  address1: string;
  address2: string;
  province: string;
  lastName: string;
  firstName: string;
  customerId: Types.ObjectId;
  countryCode: string;
  countryName: string;
  provinceCode: string;
}

export interface AddressDocument extends Document, AddressAttributes {}

export interface LeanAddressDocument extends LeanDocument<AddressAttributes> {
  _id: string;
  __v: number;
}

// eslint-disable-next-line
export interface AddressModel extends Model<AddressDocument> {}
