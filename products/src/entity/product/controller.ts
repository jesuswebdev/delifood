'use strict';

import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ResponseValue
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import {
  TagModel,
  getModel,
  MongoError,
  castToObjectId,
  ProductAttributes,
  ProductModel,
  CategoryModel,
  assertNonDuplicateIds,
  QUEUE_CHANNELS
} from '@delifood/common';

export async function createProduct(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const publish = request.server.plugins.nats.publish;
    const payload = request.payload as ProductAttributes;
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );

    for (const strings of [payload.images, payload.categories, payload.tags]) {
      if (strings?.length) {
        const duplicate = !assertNonDuplicateIds(strings as string[]);

        if (duplicate) {
          return Boom.badData('Array contains duplicate values.');
        }
      }
    }

    if (payload.categories?.length) {
      const categories = await getModel<CategoryModel>(
        request.server.plugins,
        'Category'
      ).find({
        _id: {
          $in: (payload.categories as string[]).map((category: string) =>
            castToObjectId(category)
          )
        }
      });

      if (categories.length !== payload.categories.length) {
        return Boom.badData('One of the supplied categories does not exist');
      }
    }

    if (payload.tags?.length) {
      const tags = await getModel<TagModel>(request.server.plugins, 'Tag').find(
        {
          _id: {
            $in: (payload.tags as string[]).map((tag: string) =>
              castToObjectId(tag)
            )
          }
        }
      );

      if (tags.length !== payload.tags.length) {
        return Boom.badData('One of the supplied tags does not exist');
      }
    }

    const saved = await productModel.create(payload);

    publish(QUEUE_CHANNELS.PRODUCT_CREATED, saved);

    return h.response(saved).code(201);
  } catch (error: unknown) {
    if ((error as MongoError)?.code === 11000) {
      return Boom.conflict();
    }

    return Boom.internal();
  }
}

export async function getProduct(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );
    const product = await productModel
      .findById(castToObjectId(id))
      .populate({ path: 'tags' })
      .populate({ path: 'categories' });

    if (!product) {
      return Boom.notFound();
    }

    return h.response(product);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function listProducts(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );
    const products = await productModel.find();

    return h.response(products);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function patchProduct(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const payload = request.payload as ProductAttributes;
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );

    if ((payload.images ?? []).length) {
      const duplicateImages = !assertNonDuplicateIds(payload.images ?? []);

      if (duplicateImages) {
        return Boom.badData('Duplicate values in the images array');
      }
    }

    const result = await productModel.findByIdAndUpdate(
      castToObjectId(id),
      { $set: payload },
      { new: true }
    );

    if (!result) {
      return Boom.notFound();
    }

    return h.response(result).code(200);
  } catch (error: unknown) {
    if ((error as MongoError)?.code === 11000) {
      return Boom.conflict();
    }

    return Boom.internal();
  }
}

export async function deleteProduct(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const id: string = request.params.id;
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );
    const result = await productModel.findByIdAndDelete(castToObjectId(id));

    if (!result) {
      return Boom.notFound();
    }

    return h.response().code(204);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function putProductTags(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const tagsIds: string[] = request.payload as string[];
    const productId: string = request.params.id as string;
    const tagModel = getModel<TagModel>(request.server.plugins, 'Tag');
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );

    if (!assertNonDuplicateIds(tagsIds)) {
      return Boom.badData('The array contains duplicate tags.');
    }

    const product = await productModel.findById(castToObjectId(productId));

    if (product) {
      const tags = await tagModel.find({
        _id: { $in: tagsIds.map(castToObjectId) }
      });

      if (tags.length !== tagsIds.length) {
        return Boom.badData('One of the tags does not exist.');
      }

      product.tags = tags;
      await product.save();
    } else {
      return Boom.notFound();
    }

    return h.response(product);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}

export async function putProductCategories(
  request: Request,
  h: ResponseToolkit
): Promise<ResponseObject | ResponseValue> {
  try {
    const categoryIds: string[] = request.payload as string[];
    const productId: string = request.params.id as string;
    const categoryModel = getModel<CategoryModel>(
      request.server.plugins,
      'Category'
    );
    const productModel = getModel<ProductModel>(
      request.server.plugins,
      'Product'
    );

    if (!assertNonDuplicateIds(categoryIds)) {
      return Boom.badData('The array contains duplicate categories.');
    }

    const product = await productModel.findById(castToObjectId(productId));

    if (product) {
      const categories = await categoryModel.find({
        _id: { $in: categoryIds.map(castToObjectId) }
      });

      if (categories.length !== categoryIds.length) {
        return Boom.badData('One of the categories does not exist.');
      }

      product.categories = categories;
      await product.save();
    } else {
      return Boom.notFound();
    }

    return h.response(product);
  } catch (error) {
    console.error(error);

    return Boom.internal();
  }
}
