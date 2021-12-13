'use strict';
import { Server, ServerInjectOptions } from '@hapi/hapi';
import { describe, it, beforeEach, before, after, Done } from 'mocha';
import { expect } from 'chai';
import {
  cloneObject,
  AUTH_STRATEGY,
  getModel,
  TagDocument,
  TagModel,
  TagAttributes,
  LeanTagDocument,
  insertDummyTag
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

const cleanUp = async function cleanUp(server: Server) {
  const tagModel = getModel<TagModel>(server.plugins, 'Tag');
  await tagModel.deleteMany();
};

describe('Test Tag Routes', () => {
  let server: Server;
  let mongod: MongoMemoryServer;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    await init({ mongodbUri: mongod.getUri() }).then(s => {
      server = s;
    });
  });

  after(done => {
    server.stop();
    mongod.stop().then(() => {
      done();
    });
  });

  describe('Create Tag', () => {
    let request: ServerInjectOptions & { payload: Partial<TagAttributes> };
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['create:tag'] }
    };

    beforeEach(async () => {
      await cleanUp(server);
      request = {
        method: 'POST',
        url: '/api/products/tags',
        payload: { value: 'new tag' },
        auth: cloneObject(defaultAuthObject)
      };
    });

    it('should create a tag', async () => {
      const response = await server.inject(request);

      const result = response.result as LeanTagDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.value).to.equal(request.payload.value);
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
      request.auth.credentials.scope = ['save:tag'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail when the value is short', async () => {
      request.payload.value = 'a';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when the value exceeds the allowed length', async () => {
      request.payload.value = '123123123123123123123123123123123';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should not allow duplicate tags', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(201);
      const response_2 = await server.inject(request);
      expect(response_2.statusCode).to.equal(409);
    });
  });

  describe('List Tags', () => {
    let tagModel: TagModel;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['list:tag'] }
    };

    before(async () => {
      tagModel = getModel<TagModel>(server.plugins, 'Tag');
      await cleanUp(server);
      await insertDummyTag(tagModel);
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach((done: Done) => {
      request = {
        method: 'GET',
        url: '/api/products/tags',
        auth: cloneObject(defaultAuthObject)
      };
      done();
    });

    it('should return an array of tags', async () => {
      const response = await server.inject(request);
      const result = response.result as LeanTagDocument[];
      expect(Array.isArray(result)).to.be.true;
      expect(result[0]._id).to.exist;
      expect(result[0].value).to.exist;
    });

    it('should return an empty array', async () => {
      await cleanUp(server);
      const response = await server.inject(request);
      const result = response.result as LeanTagDocument[];
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
      request.auth.credentials.scope = ['save:tag'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });
  });

  describe('Delete Tag', () => {
    let tag: TagDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: { id: 'asd123' }, scope: ['delete:tag'] }
    };

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      tag = await insertDummyTag(getModel(server.plugins, 'Tag'));
      request = {
        method: 'DELETE',
        url: '/api/products/tags/' + tag._id,
        auth: cloneObject({ ...defaultAuthObject })
      };
    });

    it('should delete a tag', async () => {
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
      request.auth.credentials.scope = ['save:tag'];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    it('should fail with error 404 when tag does not exist / no rows affected by update query', async () => {
      request.url = '/api/products/tags/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });
});
