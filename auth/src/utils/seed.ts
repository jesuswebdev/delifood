import {
  getModel,
  PermissionModel,
  PermissionAttributes,
  RoleModel,
  UserModel
} from '@delifood/common';
import { init } from '../server';

const types = ['create', 'get', 'list', 'patch', 'update', 'delete'];
const entities = [
  'permission',
  'role',
  'user',
  'product',
  'tag',
  'category',
  'cart',
  'cart/item'
];

const defaultPermissions = entities.flatMap(entity => {
  return types.map(type => ({
    name: `${type} ${entity}`,
    value: `${type}:${entity}`
  }));
});

const permissions: PermissionAttributes[] = defaultPermissions.concat([
  { name: 'Put role permissions', value: 'put:role/permission' },
  { name: 'Put user role', value: 'put:user/role' },
  { name: 'Put product categories', value: 'put:product/categories' }
]);

init().then(async server => {
  const permissionModel: PermissionModel = getModel(
    server.plugins,
    'Permission'
  );
  const roleModel: RoleModel = getModel(server.plugins, 'Role');
  const userModel: UserModel = getModel(server.plugins, 'User');

  await permissionModel.deleteMany();

  const createdPermissions = await permissionModel.create(permissions);
  const createdRole = await roleModel.create({
    name: 'Admin',
    permissions: createdPermissions
  });

  await userModel.create({
    email: 'admin@admin.com',
    password: 'adminadmin',
    roles: [createdRole]
  });

  await server.stop();
});
