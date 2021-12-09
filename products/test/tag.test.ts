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
  LeanTagDocument
} from '@delifood/common';
import { init } from '../src/server';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function insertDummyTag(
  model: TagModel,
  text?: string
): Promise<TagDocument> {
  const p: TagDocument = await model.create({
    value: text ?? 'dummy tag'
  });
  return p;
}

const cleanUp = async function cleanUp(server: Server) {
  const tagModel = getModel<TagModel>(server.plugins, 'Tag');
  await tagModel.deleteMany();
};

describe('Test Tag Routes', async () => {
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
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['create:tag'] }
    };

    beforeEach(done => {
      request = {
        method: 'POST',
        url: '/tags',
        payload: { value: 'new tag' },
        auth: cloneObject(defaultAuthObject)
      };
      const model = getModel<TagModel>(server.plugins, 'Tag');
      model
        .deleteMany()
        .exec()
        .then(() => done());
    });

    it('should create a tag', async () => {
      const response = await server.inject(request);

      const result = response.result as LeanTagDocument;

      expect(response.statusCode).to.equal(201);
      expect(result._id).to.exist;
      expect(result.value).to.equal((request.payload as TagAttributes).value);
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
      (request.payload as TagAttributes).value = 'a';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    it('should fail when the value exceeds the allowed length', async () => {
      (request.payload as TagAttributes).value =
        '123123123123123123123123123123123';
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
      credentials: { user: 'test', scope: ['list:tag'] }
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
        url: '/tags',
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
    let tagModel: TagModel;
    let tag: TagDocument;
    let request: ServerInjectOptions;
    const defaultAuthObject = {
      strategy: AUTH_STRATEGY.TOKEN_AUTH,
      credentials: { user: 'test', scope: ['delete:tag'] }
    };

    before(async () => {
      tagModel = getModel<TagModel>(server.plugins, 'Tag');
    });

    after(async () => {
      await cleanUp(server);
    });

    beforeEach(async () => {
      await cleanUp(server);
      tag = await insertDummyTag(tagModel);
      request = {
        method: 'DELETE',
        url: '/tags/' + tag._id,
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
      request.url = '/tags/abababababababababababab';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });
  });
});
