import {
  Document,
  LeanDocument,
  Model,
  Types,
  SchemaDefinitionProperty
} from 'mongoose';
import { LeanPermissionDocument } from './permission';

export interface RoleAttributes {
  name: string;
  description?: string;
  permissions:
    | SchemaDefinitionProperty<Types.ObjectId>[]
    | LeanPermissionDocument[];
}

export interface RoleDocument extends Document, RoleAttributes {}

// eslint-disable-next-line
export interface LeanRoleDocument extends LeanDocument<RoleAttributes> {}

// eslint-disable-next-line
export interface RoleModel extends Model<RoleDocument> {}
