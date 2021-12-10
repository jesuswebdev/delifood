import { Document, Model, LeanDocument, Types } from 'mongoose';
import {
  LeanUserDocument,
  CartItemAttributes
} from './index';

export interface CartAttributes {
  user: Types.ObjectId | LeanUserDocument;
  items: CartItemAttributes[];
}

export interface CartDocument extends Document, CartAttributes {}

export interface LeanCartDocument extends LeanDocument<CartAttributes> {
  _id: string;
}

// eslint-disable-next-line
export interface CartModel extends Model<CartDocument> {}
