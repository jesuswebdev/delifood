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
  RoleAttributes,
  MongoError,
  castToObjectId,
  PermissionModel
} from '@delifood/common';

const assertPermissionIds = function assertPermissionIds(
  permissions: string[]
): boolean {
  const aux: { [key: string]: number } = {};
  for (const p of permissions) {
    if (aux[p]) {
      return false;
    }
    aux[p] = 1;
  }
  return true;
};

export async function createRole(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const payload = request.payload as RoleAttributes;
    const RoleModel = getModel<RoleModel>(request.server.plugins, 'Role');

    const saved = await RoleModel.create(payload);
    return h.response(saved).code(201);
    // eslint-disable-next-line
  } catch (error: unknown) {
    if ((error as MongoError)?.code === 11000) {
      return Boom.conflict();
    }
    return Boom.internal();
  }
}

export async function getRole(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const RoleModel = getModel<RoleModel>(request.server.plugins, 'Role');
    const role = await RoleModel.findById(castToObjectId(id)).populate({
      path: 'permissions'
    });
    if (!role) return Boom.notFound();
    return h.response(role);
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
}

export async function listRoles(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const RoleModel = getModel<RoleModel>(request.server.plugins, 'Role');
    const roles = await RoleModel.find();
    return h.response(roles);
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
}

export async function patchRole(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const payload = request.payload as RoleAttributes;
    const RoleModel = getModel<RoleModel>(request.server.plugins, 'Role');

    const result = await RoleModel.findByIdAndUpdate(castToObjectId(id), {
      $set: payload
    });
    if (!result) return Boom.notFound();
    return h.response().code(204);
    // eslint-disable-next-line
  } catch (error: unknown) {
    if ((error as MongoError)?.code === 11000) {
      return Boom.conflict();
    }
    return Boom.internal();
  }
}

export async function deleteRole(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const RoleModel = getModel<RoleModel>(request.server.plugins, 'Role');
    const result = await RoleModel.findByIdAndDelete(castToObjectId(id));
    if (!result) return Boom.notFound();
    return h.response().code(204);
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
}

export async function putRolePermissions(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const permissionsIds: string[] = request.payload as string[];
    const roleId: string = request.params.id as string;
    const permissionModel = getModel<PermissionModel>(
      request.server.plugins,
      'Permission'
    );
    const RoleModel = getModel<RoleModel>(request.server.plugins, 'Role');

    if (!assertPermissionIds(permissionsIds)) {
      return Boom.badData('The array contains duplicate permissions.');
    }

    const role = await RoleModel.findById(castToObjectId(roleId));

    if (role) {
      const permissions = await permissionModel.find({
        _id: { $in: permissionsIds.map(castToObjectId) }
      });

      if (permissions.length !== permissionsIds.length) {
        return Boom.badData('One of the permissions does not exist.');
      }

      role.permissions = permissions;
      await role.save();
    } else {
      return Boom.notFound();
    }
    return h.response(role);
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
}
