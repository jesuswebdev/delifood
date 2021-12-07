import {
  Document,
  LeanDocument,
  Model,
  Types,
  SchemaDefinitionProperty
} from 'mongoose';
import { LeanPermissionDocument } from './index';

export interface RoleAttributes {
  name: string;
  description?: string;
  permissions:
    | SchemaDefinitionProperty<Types.ObjectId>[]
    | LeanPermissionDocument[];
}

export interface RoleDocument extends Document, RoleAttributes {}

export interface LeanRoleDocument extends LeanDocument<RoleAttributes> {
  _id: string;
}

// eslint-disable-next-line
export interface RoleModel extends Model<RoleDocument> {}
