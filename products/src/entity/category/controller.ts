'use strict';

import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ResponseValue
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import {
  getModel,
  MongoError,
  castToObjectId,
  CategoryAttributes,
  CategoryModel
} from '@delifood/common';

export async function createCategory(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const payload = request.payload as CategoryAttributes;
    const categoryModel = getModel<CategoryModel>(
      request.server.plugins,
      'Category'
    );
    const saved = await categoryModel.create(payload);

    return h.response(saved).code(201);
  } catch (error: unknown) {
    if ((error as MongoError)?.code === 11000) {
      return Boom.conflict();
    }

    return Boom.internal();
  }
}

export async function getCategory(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const categoryModel = getModel<CategoryModel>(
      request.server.plugins,
      'Category'
    );
    const category = await categoryModel.findById(castToObjectId(id));

    if (!category) {
      return Boom.notFound();
    }

    return h.response(category);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function listCategories(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const categoryModel = getModel<CategoryModel>(
      request.server.plugins,
      'Category'
    );
    const categories = await categoryModel.find();

    return h.response(categories);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function patchCategory(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const payload = request.payload as CategoryAttributes;
    const categoryModel = getModel<CategoryModel>(
      request.server.plugins,
      'Category'
    );
    const result = await categoryModel.findByIdAndUpdate(castToObjectId(id), {
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

export async function deleteCategory(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const categoryModel = getModel<CategoryModel>(
      request.server.plugins,
      'Category'
    );
    const result = await categoryModel.findByIdAndDelete(castToObjectId(id));

    if (!result) {
      return Boom.notFound();
    }

    return h.response().code(204);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}
