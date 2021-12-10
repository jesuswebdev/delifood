import {
  PermissionModel,
  PermissionDocument,
  PermissionAttributes,
  RoleModel,
  RoleDocument,
  RoleAttributes,
  UserModel,
  UserDocument,
  UserAttributes,
  CategoryModel,
  CategoryDocument,
  CategoryAttributes,
  TagModel,
  TagDocument,
  TagAttributes,
  ProductModel,
  ProductDocument,
  ProductAttributes
} from './index';

export const insertDummyPermission = async function insertDummyPermission(
  model: PermissionModel,
  props?: Partial<PermissionAttributes>
): Promise<PermissionDocument> {
  const doc = await model.create({
    name: 'Dummy Permission',
    value: 'create:permission',
    description: 'Dummy Permission description',
    ...props
  });
  return doc;
};

export const insertDummyRole = async function insertDummyRole(
  model: RoleModel,
  props?: Partial<RoleAttributes>
): Promise<RoleDocument> {
  const doc = await model.create({
    name: 'Dummy role',
    description: 'Dummy role description',
    ...props
  });
  return doc;
};

export const insertDummyUser = async function insertDummyUser(
  model: UserModel,
  props?: Partial<UserAttributes>
): Promise<UserDocument> {
  const doc = await model.create({
    email: 'dummyuser@test.com',
    password: 'password1234',
    ...props
  });
  return doc;
};

export const insertDummyCategory = async function insertDummyCategory(
  model: CategoryModel,
  props?: Partial<CategoryAttributes>
): Promise<CategoryDocument> {
  const doc = await model.create({
    name: 'Dummy Category',
    description: 'Dummy category description',
    ...props
  });
  return doc;
};

export const insertDummyTag = async function insertDummyTag(
  model: TagModel,
  props?: Partial<TagAttributes>
): Promise<TagDocument> {
  const doc = await model.create({
    value: 'Dummy tag',
    ...props
  });
  return doc;
};

export const insertDummyProduct = async function insertDummyProduct(
  model: ProductModel,
  props?: Partial<ProductAttributes>
): Promise<ProductDocument> {
  const doc = await model.create({
    name: 'Dummy product',
    description: 'Dummy product description',
    sku: 'asdf123',
    price: 1337,
    images: ['http://cats.com'],
    ...props
  });
  return doc;
};
