'use strict';

import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ResponseValue
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import {
  castToObjectId,
  MongoError,
  getModel,
  TagAttributes,
  TagModel
} from '@delifood/common';

export async function createTag(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const payload = request.payload as TagAttributes;
    const tagModel = getModel<TagModel>(request.server.plugins, 'Tag');
    const saved = await tagModel.create(payload);

    return h.response(saved).code(201);
  } catch (error: unknown) {
    if ((error as MongoError).code === 11000) {
      return Boom.conflict();
    }

    return Boom.internal();
  }
}

export async function listTags(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const tagModel = getModel<TagModel>(request.server.plugins, 'Tag');
    const tags = await tagModel.find();

    return h.response(tags);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function deleteTag(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const tagModel = getModel<TagModel>(request.server.plugins, 'Tag');
    const result = await tagModel.findByIdAndRemove(castToObjectId(id));

    if (!result) {
      return Boom.notFound();
    }

    return h.response().code(204);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}
