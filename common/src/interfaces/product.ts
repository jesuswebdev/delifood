import { Document, Model, LeanDocument, Types } from 'mongoose';
import { LeanTagDocument, LeanCategoryDocument } from './index';

export interface ProductAttributes {
  name: string;
  description?: string;
  sku: string;
  price: number;
  enabled?: boolean;
  images?: string[];
  rating?: number;
  orders?: number;
  discount?: number;
  categories: Types.ObjectId[] | LeanCategoryDocument[] | string[];
  tags: Types.ObjectId[] | LeanTagDocument[] | string[];
}

export interface ProductDocument extends Document, ProductAttributes {}

export interface LeanProductDocument extends LeanDocument<ProductAttributes> {
  _id: string;
  __v: number;
}

// eslint-disable-next-line
export interface ProductModel extends Model<ProductDocument> {}
