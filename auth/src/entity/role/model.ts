'use strict';
import { Connection } from 'mongoose';
import { createRoleSchema } from '@delifood/common';

const schema = createRoleSchema();

const createRoleModel = function createRoleModel(connection: Connection) {
  connection.model('Role', schema);
};

export { createRoleModel };
