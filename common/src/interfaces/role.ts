import { Document, LeanDocument, Model, Types } from 'mongoose';
import { LeanPermissionDocument } from './index';

export interface RoleAttributes {
  name: string;
  description?: string;
  permissions: Types.ObjectId[] | LeanPermissionDocument[] | string[];
}

export interface RoleDocument extends Document, RoleAttributes {}

export interface LeanRoleDocument extends LeanDocument<RoleAttributes> {
  _id: string;
  __v: number;
}

// eslint-disable-next-line
export interface RoleModel extends Model<RoleDocument> {}
