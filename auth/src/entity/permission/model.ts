'use strict';
import { Connection } from 'mongoose';
import { createPermissionSchema } from '@delifood/common';

const schema = createPermissionSchema();

const createPermissionModel = function createPermissionModel(
  connection: Connection
) {
  connection.model('Permission', schema);
};

export { createPermissionModel };
