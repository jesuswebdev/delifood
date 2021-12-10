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

interface ServerInjectObject<T> {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  payload: T;
  auth: {
    strategy: string;
    credentials: {
      user: object;
      scope: string[];
    };
  };
}

export const insertDummyPermission = async function insertDummyPermission(
  model: PermissionModel,
  props?: PermissionAttributes
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
  props?: RoleAttributes
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
  props?: UserAttributes
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
  props?: CategoryAttributes
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
  props?: TagAttributes
): Promise<TagDocument> {
  const doc = await model.create({
    value: 'Dummy tag',
    ...props
  });
  return doc;
};

export const insertDummyProduct = async function insertDummyProduct(
  model: ProductModel,
  props?: ProductAttributes
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

export const getRequestObject = function getRequestObject<T>(
  props: ServerInjectObject<T>
) {
  return function (overrides?: ServerInjectObject<T>): ServerInjectObject<T> {
    return {
      ...props,
      ...overrides,
      auth: {
        ...props.auth,
        ...overrides?.auth,
        credentials: {
          ...props.auth.credentials,
          ...overrides?.auth?.credentials
        }
      }
    };
  };
};
