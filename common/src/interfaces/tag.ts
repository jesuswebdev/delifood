import { Document, Model, LeanDocument } from 'mongoose';

export interface TagAttributes {
  value: string;
}

export interface TagDocument extends Document, TagAttributes {}

export interface LeanTagDocument extends LeanDocument<TagAttributes> {
  _id: string;
}

// eslint-disable-next-line
export interface TagModel extends Model<TagDocument> {}
