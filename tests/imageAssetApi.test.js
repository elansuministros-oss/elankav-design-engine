'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const {
  createInternalDesignApi,
} = require('../api/internalDesignApi');

const ASSET_ID = '22222222-2222-4222-8222-222222222222';

function request(url) {
  const req = Readable.from([]);
  req.method = 'GET';
  req.url = url;
  return req;
}

function response() {
  const capture = { statusCode: null, headers: {}, body: null };
  return {
    capture,
    res: {
      setHeader(name, value) {
        capture.headers[name.toLowerCase()] = value;
      },
      end(value) {
        capture.body = value;
      },
      set statusCode(value) {
        capture.statusCode = value;
      },
      get statusCode() {
        return capture.statusCode;
      },
    },
  };
}

test('/internal/assets/:id devuelve PNG', async () => {
  let requestedPath;
  const handler = createInternalDesignApi({
    designEngine: { async execute() { return {}; } },
    outputDir: '/tmp/design-assets',
    fsImpl: {
      async readFile(filePath) {
        requestedPath = filePath;
        return Buffer.from('png');
      },
    },
  });
  const { capture, res } = response();

  await handler(request(`/internal/assets/${ASSET_ID}`), res);

  assert.equal(capture.statusCode, 200);
  assert.equal(capture.headers['content-type'], 'image/png');
  assert.deepEqual(capture.body, Buffer.from('png'));
  assert.equal(requestedPath, `/tmp/design-assets/${ASSET_ID}.png`);
});

test('/internal/assets bloquea traversal', async () => {
  let readCalled = false;
  const handler = createInternalDesignApi({
    designEngine: { async execute() { return {}; } },
    fsImpl: {
      async readFile() {
        readCalled = true;
      },
    },
  });
  const { capture, res } = response();

  await handler(request('/internal/assets/..%2F..%2Fetc%2Fpasswd'), res);

  assert.equal(capture.statusCode, 404);
  assert.equal(readCalled, false);
  const payload = JSON.parse(capture.body);
  assert.equal(payload.error, 'ASSET_NOT_FOUND');
});

test('/internal/assets devuelve 404 controlado', async () => {
  const handler = createInternalDesignApi({
    designEngine: { async execute() { return {}; } },
    fsImpl: {
      async readFile() {
        const error = new Error('not found');
        error.code = 'ENOENT';
        throw error;
      },
    },
  });
  const { capture, res } = response();

  await handler(request(`/internal/assets/${ASSET_ID}`), res);

  assert.equal(capture.statusCode, 404);
  assert.equal(JSON.parse(capture.body).error, 'ASSET_NOT_FOUND');
});
