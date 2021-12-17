import { Document, Model, LeanDocument, Types } from 'mongoose';
import { LeanCategoryDocument } from './index';
import { PRODUCT_STATUS } from '../index';

export interface ProductAttributes {
  title: string;
  description?: string;
  status: PRODUCT_STATUS;
  sku: string;
  price: number;
  enabled?: boolean;
  images?: string[];
  rating?: number;
  orders?: number;
  discount?: number;
  categories: Types.ObjectId[] | LeanCategoryDocument[] | string[];
  tags: string[];
}

export interface ProductDocument extends Document, ProductAttributes {}

export interface LeanProductDocument extends LeanDocument<ProductAttributes> {
  _id: string;
  __v: number;
}

// eslint-disable-next-line
export interface ProductModel extends Model<ProductDocument> {}
