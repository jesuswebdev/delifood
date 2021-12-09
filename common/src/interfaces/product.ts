import {
  Document,
  Model,
  LeanDocument,
  SchemaDefinitionProperty,
  Types
} from 'mongoose';
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
  categories?:
    | SchemaDefinitionProperty<Types.ObjectId>[]
    | LeanCategoryDocument[]
    | string[];
  tags?:
    | SchemaDefinitionProperty<Types.ObjectId>[]
    | LeanTagDocument[]
    | string[];
}

export interface ProductDocument extends Document, ProductAttributes {}

export interface LeanProductDocument extends LeanDocument<ProductAttributes> {
  _id: string;
}

// eslint-disable-next-line
export interface ProductModel extends Model<ProductDocument> {}
