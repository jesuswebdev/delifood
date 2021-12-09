import {
  Document,
  Model,
  LeanDocument,
  SchemaDefinitionProperty,
  Types
} from 'mongoose';
import { LeanProductDocument } from './index';

export interface CartItemAttributes {
  product: SchemaDefinitionProperty<Types.ObjectId> | LeanProductDocument;
  quantity: number;
}

export interface CartItemDocument extends Document, CartItemAttributes {}

export interface LeanCartItemDocument
  extends LeanDocument<CartItemAttributes> {
  _id: string;
}

// eslint-disable-next-line
export interface CartItemModel extends Model<CartItemDocument> {}
