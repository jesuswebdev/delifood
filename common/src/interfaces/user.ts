import { Document, LeanDocument, Model, Types } from 'mongoose';
import { LeanRoleDocument, LeanCustomerProfileDocument } from './index';
import { USER_STATUS } from '../index';

export interface UserAttributes {
  email: string;
  password?: string;
  status: USER_STATUS;
  roles: Types.ObjectId[] | LeanRoleDocument[] | string[];
  profile: Types.ObjectId | LeanCustomerProfileDocument | string;
}

export interface UserDocument extends Document, UserAttributes {}

export interface LeanUserDocument extends LeanDocument<UserAttributes> {
  _id: string;
  __v: number;
}

// eslint-disable-next-line
export interface UserModel extends Model<UserDocument> {}
