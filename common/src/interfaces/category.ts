import { Document, Model, LeanDocument } from 'mongoose';

export interface CategoryAttributes {
  name: string;
  description?: string;
}

export interface CategoryDocument extends Document, CategoryAttributes {}

export interface LeanCategoryDocument extends LeanDocument<CategoryAttributes> {
  _id: string;
  __v: number;
}

// eslint-disable-next-line
export interface CategoryModel extends Model<CategoryDocument> {}
