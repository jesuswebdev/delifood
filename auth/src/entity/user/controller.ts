'use strict';

import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ResponseValue
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import {
  RoleModel,
  getModel,
  MongoError,
  castToObjectId,
  UserAttributes,
  UserModel,
  QUEUE_CHANNELS,
  LeanUserDocument
} from '@delifood/common';

const assertRolesIds = function assertRolesIds(roles: string[]): boolean {
  const aux: { [key: string]: number } = {};

  for (const r of roles) {
    if (aux[r]) {
      return false;
    }

    aux[r] = 1;
  }

  return true;
};

export async function createUser(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const publish = request.server.plugins.nats.publish;
    const payload = request.payload as UserAttributes;
    const userModel = getModel<UserModel>(request.server.plugins, 'User');
    const saved = await userModel.create(payload);
    const sanitized = saved.toJSON();
    sanitized.password = undefined;
    publish(QUEUE_CHANNELS.USER_CREATED, saved);

    return h.response(sanitized).code(201);
  } catch (error: unknown) {
    if ((error as MongoError)?.code === 11000) {
      return Boom.conflict();
    }

    return Boom.internal();
  }
}

export async function getUser(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const userModel = getModel<UserModel>(request.server.plugins, 'User');
    const user = await userModel.findById(castToObjectId(id)).populate({
      path: 'roles',
      populate: { path: 'permissions' }
    });

    if (!user) {
      return Boom.notFound();
    }

    return h.response(user);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function listUsers(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const userModel = getModel<UserModel>(request.server.plugins, 'User');
    const users = await userModel.find();

    return h.response(users);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function patchUser(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const payload = request.payload as UserAttributes;
    const userModel = getModel<UserModel>(request.server.plugins, 'User');
    const result = await userModel.findByIdAndUpdate(castToObjectId(id), {
      $set: payload
    });

    if (!result) {
      return Boom.notFound();
    }

    return h.response().code(204);
  } catch (error: unknown) {
    if ((error as MongoError)?.code === 11000) {
      return Boom.conflict();
    }

    return Boom.internal();
  }
}

export async function deleteUser(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const userModel = getModel<UserModel>(request.server.plugins, 'User');
    const result = await userModel.findByIdAndDelete(castToObjectId(id));

    if (!result) {
      return Boom.notFound();
    }

    return h.response().code(204);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function putUserRoles(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseValue | LeanUserDocument> {
  try {
    const rolesIds = request.payload as string[];
    const userId: string = request.params.id as string;
    const roleModel = getModel<RoleModel>(request.server.plugins, 'Role');
    const userModel = getModel<UserModel>(request.server.plugins, 'User');

    if (!assertRolesIds(rolesIds)) {
      return Boom.badData('The array contains duplicate roles.');
    }

    let user = await userModel.findById(castToObjectId(userId));

    if (!user) {
      return Boom.notFound();
    }

    const roles = await roleModel.find({
      _id: { $in: rolesIds.map(castToObjectId) }
    });

    if (roles.length !== rolesIds.length) {
      return Boom.badData('One of the roles does not exist.');
    }

    user = await userModel.findByIdAndUpdate(
      user._id,
      { $set: { roles } },
      { new: true }
    );

    return h.response(user as LeanUserDocument);
  } catch (error) {
    return Boom.internal();
  }
}
