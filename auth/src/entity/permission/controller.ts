'use strict';

import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ResponseValue
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import {
  PermissionModel,
  PermissionAttributes,
  castToObjectId,
  MongoError
} from '@delifood/common';

function getPermissionModel(request: Request): PermissionModel {
  return request.server.plugins.mongoose.connection.model('Permission');
}

export async function createPermission(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const payload = request.payload as PermissionAttributes;
    const PermissionModel = getPermissionModel(request);

    const saved = await PermissionModel.create(payload);
    return h.response(saved).code(201);
  } catch (error: unknown) {
    if ((error as MongoError).code === 11000) {
      return Boom.conflict();
    }
    return Boom.internal();
  }
}

export async function getPermission(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const PermissionModel = getPermissionModel(request);
    const permission = await PermissionModel.findById(castToObjectId(id));
    if (!permission) return Boom.notFound();
    return h.response(permission);
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
}

export async function listPermissions(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const PermissionModel = getPermissionModel(request);
    const permissions = await PermissionModel.find();
    return h.response(permissions);
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
}

export async function patchPermission(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const payload = request.payload as PermissionAttributes;
    const PermissionModel = getPermissionModel(request);
    const result = await PermissionModel.findByIdAndUpdate(castToObjectId(id), {
      $set: payload
    });
    if (!result) return Boom.notFound();
    return h.response().code(204);
  } catch (error) {
    if ((error as MongoError).code === 11000) {
      return Boom.conflict();
    }
    return Boom.internal();
  }
}

export async function deletePermission(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const PermissionModel = getPermissionModel(request);
    const result = await PermissionModel.findByIdAndRemove(castToObjectId(id));
    if (!result) return Boom.notFound();
    return h.response().code(204);
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
}
