import {
  Document,
  LeanDocument,
  Model,
  Types,
  SchemaDefinitionProperty
} from 'mongoose';
import { LeanRoleDocument } from './index';

export interface UserAttributes {
  email: string;
  password?: string;
  enabled: boolean;
  roles: SchemaDefinitionProperty<Types.ObjectId>[] | LeanRoleDocument[];
}

export interface UserDocument extends Document, UserAttributes {}

export interface LeanUserDocument extends LeanDocument<UserAttributes> {
  _id: string;
}

// eslint-disable-next-line
export interface UserModel extends Model<UserDocument> {}
