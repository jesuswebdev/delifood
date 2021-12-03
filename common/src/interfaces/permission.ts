import { Document, Model } from 'mongoose';

export interface PermissionAttributes {
  name: string;
  description?: string;
  value: string;
}

export interface PermissionDocument extends Document, PermissionAttributes {}

export interface PermissionModel extends Model<PermissionDocument> {}
