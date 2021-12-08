'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after, Done } from 'mocha';
import { expect } from 'chai';
import {
  cloneObject,
  PermissionAttributes,
  AUTH_STRATEGY,
  getModel,
  RoleModel,
  RoleDocument,
  RoleAttributes,
  PermissionModel,
  PermissionDocument,
  LeanRoleDocument
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

const insertDummyPermission = async function insertDummyPermission(
  model: PermissionModel,
  text?: string
): Promise<PermissionDocument> {
  const p = await model.create({
    name: `Dummy Permission${text ? ' ' + text : ''}`,
    value: 'create:permission',
    description: 'Dummy Permission description'
  });
  return p;
};
const insertDummyRole = async function insertDummyRole(
  model: RoleModel,
  text?: string
): Promise<RoleDocument> {
  const doc = await model.create({
    name: `Dummy role${text ? ' ' + text : ''}`,
    description: 'Dummy role description'
  });
  return doc;
};

const cleanUp = async function cleanUp(server: Server) {
  const permissionModel = getModel<PermissionModel>(
    server.plugins,
    'Permission'
  );
  const roleModel = getModel<RoleModel>(server.plugins, 'Role');

  await permissionModel.deleteMany();
  await roleModel.deleteMany();
};

describe('Test Role Routes', async () => {
  let server: Server;
  let mongod: MongoMemoryServer;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    await init({ mongodbUri: mongod.getUri() }).then(s => {
      server = s;
    });
  });

  after((done: Done) => {
    server.stop();
    mongod.stop().then(() => {
      done();
    });
  });

  describe('Create Role', () => {
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['create:role'] }
    };

    beforeEach((done: Done) => {
      request = {
        method: 'POST',
        url: '/roles',
        payload: {
          name: 'New role',
          description: 'a description'
        },
        auth: cloneObject(defaultAuthObject)
      };
      const model = getModel<RoleModel>(server.plugins, 'Role');
      model
        .deleteMany()
        .exec()
        .then(() => done());
    });

    it('should create a role', async () => {
      const response = await server.inject(request);

      const result = response.result as RoleDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.name).to.equal(
        (request.payload as PermissionAttributes).name
      );
      expect(result.description).to.equal(
        (request.payload as PermissionAttributes).description
      );
    });

    it('should create a role without description', async () => {
      (request.payload as RoleAttributes).description = undefined;
      const response = await server.inject(request);
      const result = response.result as RoleDocument;
      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.description).to.be.undefined;
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when the name is short', async () => {
      (request.payload as RoleAttributes).name = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when description is short', async () => {
      (request.payload as RoleAttributes).description = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate roles', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(201);
      const response_2 = await server.inject(request);
      expect(response_2.statusCode).to.equal(409);
    });
  });

  describe('Get Role', () => {
    let role: RoleDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['get:role'] }
    };

    before(async () => {
      const permissionModel = getModel<PermissionModel>(
        server.plugins,
        'Permission'
      );
      const model = getModel<RoleModel>(server.plugins, 'Role');
      await model.deleteMany();

      const dummyPermission = await insertDummyPermission(permissionModel);

      role = await model.create({
        name: 'New Role',
        description: 'New Role description'
      });

      role.permissions = [dummyPermission];
      await role.save();
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/roles/' + role._id,
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should fail when id length is not 24', async () => {
      request.url += 'ab123';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when id is not a hex string', async () => {
      request.url = '/roles/aaaaaaaaaaaaaaaaaaaaaaaz';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when id is not present', async () => {
      request.url = '/roles/';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should return 404 when role does not exist', async () => {
      request.url = '/roles/aaaaaaaaaaaaaaaaaaaaaaa1';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    it('should fail when scope is not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['list:role'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when user is not valid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials = {
        user: undefined,
        app: 'test',
        scope: ['get:role']
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should return the found role', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanRoleDocument;
      expect(response.statusCode).to.equal(200);
      expect(result._id).to.exist;
      expect(result.name).to.exist;
      expect(result.description).to.exist;
      expect(Array.isArray(result.permissions)).to.be.true;
    });
  });

  describe('List Roles', () => {
    let roleModel: RoleModel;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['list:role'] }
    };

    before(async () => {
      await cleanUp(server);
      roleModel = getModel<RoleModel>(server.plugins, 'Role');

      await roleModel.create({
        name: 'test role',
        description: 'test role description'
      });
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/roles',
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should return an array of roles', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanRoleDocument[];
      expect(Array.isArray(result)).to.be.true;
      expect(result[0]._id).to.exist;
      expect(result[0].name).to.exist;
      expect(result[0].description).to.exist;
    });

    it('should return an empty array', async () => {
      await roleModel.deleteMany();
      const response = await server.inject(request);
      const result = response.result as LeanRoleDocument[];
      expect(Array.isArray(result)).to.be.true;
      expect(result.length).to.equal(0);
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });
  });

  describe('Patch Role', () => {
    let roleModel: RoleModel;
    let role: RoleDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['patch:role'] }
    };

    before(async () => {
      await cleanUp(server);
      roleModel = getModel<RoleModel>(server.plugins, 'Role');
      role = await roleModel.create({
        name: 'test role',
        description: 'test role description'
      });
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'PATCH',
        url: '/roles/' + role._id,
        payload: {
          name: 'patched name',
          description: 'patched role test'
        },
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should patch a role', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a role name only', async () => {
      (request.payload as { name: string }) = {
        name: 'Patched name'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should allow patching a role description only', async () => {
      (request.payload as { description: string }) = {
        description: 'Patched description'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:permission'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when the name is short', async () => {
      (request.payload as RoleAttributes).name = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when description is short', async () => {
      (request.payload as RoleAttributes).description = 'new';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate roles', async () => {
      await roleModel.create({
        name: 'patched name 2',
        description: 'New role description'
      });
      (request.payload as RoleAttributes).name = 'patched name 2';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(409);
    });

    it('should fail with error 404 when role does not exist / no rows affected by update query', async () => {
      request.url = '/roles/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('Delete Role', () => {
    let roleModel: RoleModel;
    let role: RoleDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['delete:role'] }
    };

    before(async () => {
      roleModel = getModel<RoleModel>(server.plugins, 'Role');
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      role = await insertDummyRole(roleModel);
      request = {
        method: 'DELETE',
        url: '/roles/' + role._id,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should delete a role', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(204);
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject(defaultAuthObject);
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject(defaultAuthObject);
      request.auth.credentials.scope = ['save:role'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail with error 404 when role does not exist / no rows affected by update query', async () => {
      request.url = '/roles/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('Update Role Permissions', () => {
    let roleModel: RoleModel;
    let role: RoleDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['put:role/permission'] }
    };

    before(async () => {
      roleModel = getModel<RoleModel>(server.plugins, 'Role');
    });
    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      role = await insertDummyRole(roleModel);
      request = {
        method: 'PUT',
        url: `/roles/${role._id}/permissions`,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should update role permissions to the given array', async () => {
      const permission = await insertDummyPermission(
        getModel(server.plugins, 'Permission')
      );

      request.payload = [permission._id];
      const response = await server.inject(request);
      const result = response.result as LeanRoleDocument;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.permissions)).to.be.true;
      expect(result.permissions.length).to.equal(1);
      expect(result.permissions[0]).to.be.a.string;
    });

    it('should update role permissions to an empty array', async () => {
      request.payload = [];
      const response = await server.inject(request);
      const result = response.result as LeanRoleDocument;
      expect(response.statusCode).to.equal(200);
      expect(Array.isArray(result.permissions)).to.be.true;
      expect(result.permissions.length).to.equal(0);
    });

    it('should fail when the payload is not an array', async () => {
      request.payload = {};
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when the payload is empty', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when permission Id is not a string', async () => {
      request.payload = [1];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when permission Id is not of the required length', async () => {
      request.payload = ['abababababababababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when there are duplicate permissions in the array', async () => {
      const permission = await insertDummyPermission(
        getModel(server.plugins, 'Permission')
      );

      request.payload = [permission._id, permission._id];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when one of the permissions does not exist', async () => {
      request.payload = ['abababababababababababab'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    it('should fail when entity = app', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.app = 'test';
      request.auth.credentials.user = undefined;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when scope is invalid', async () => {
      request.auth = cloneObject({ ...defaultAuthObject });
      request.auth.credentials.scope = ['save:role'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });
  });
});
