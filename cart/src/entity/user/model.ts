'use strict';
import { Connection } from 'mongoose';
import { createUserSchema } from '@delifood/common';

const schema = createUserSchema();

const createUserModel = function createUserModel(connection: Connection) {
  connection.model('User', schema);
};

export { createUserModel };
