'use strict';
import { Connection } from 'mongoose';
import { createProductSchema } from '@delifood/common';

const schema = createProductSchema();

const createProductModel = function createProductModel(connection: Connection) {
  connection.model('Product', schema);
};

export { createProductModel };
