'use strict';
import { Connection } from 'mongoose';
import { createCartSchema } from '@delifood/common';

const schema = createCartSchema();

const createCartModel = function createCartModel(connection: Connection) {
  connection.model('Cart', schema);
};

export { createCartModel };
