import { Document, Model, LeanDocument } from 'mongoose';

export interface PermissionAttributes {
  name: string;
  description?: string;
  value: string;
}

export interface PermissionDocument extends Document, PermissionAttributes {}

// eslint-disable-next-line
export interface LeanPermissionDocument
  extends LeanDocument<PermissionAttributes> {}

// eslint-disable-next-line
export interface PermissionModel extends Model<PermissionDocument> {}
