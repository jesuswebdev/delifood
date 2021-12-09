'use strict';
import { Connection } from 'mongoose';
import { createTagSchema } from '@delifood/common';

const schema = createTagSchema();

const createTagModel = function createTagModel(connection: Connection) {
  connection.model('Tag', schema);
};

export { createTagModel };
