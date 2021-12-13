'use strict';
import { Connection } from 'mongoose';
import { createUserSchema, UserAttributes } from '@delifood/common';
import { Password } from '../../utils/Password';

const schema = createUserSchema();

schema.pre<UserAttributes>('save', async function () {
  const pw = await Password.hash(this.password as string);

  this.password = pw;
});

const createUserModel = function createUserModel(connection: Connection) {
  connection.model('User', schema);
};

export { createUserModel };
