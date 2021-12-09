'use strict';
import { Connection } from 'mongoose';
import { createCategorySchema } from '@delifood/common';

const schema = createCategorySchema();

const createCategoryModel = function createCategoryModel(
  connection: Connection
) {
  connection.model('Category', schema);
};

export { createCategoryModel };
