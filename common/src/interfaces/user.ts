import { Document, LeanDocument, Model, Types } from 'mongoose';
import { LeanRoleDocument } from './index';

export interface UserAttributes {
  email: string;
  password?: string;
  enabled: boolean;
  roles: Types.ObjectId[] | LeanRoleDocument[] | string[];
}

export interface UserDocument extends Document, UserAttributes {}

export interface LeanUserDocument extends LeanDocument<UserAttributes> {
  _id: string;
  __v: number;
}

// eslint-disable-next-line
export interface UserModel extends Model<UserDocument> {}
