'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const {
  createInternalDesignApi,
} = require('../api/internalDesignApi');

function createRequest({
  method = 'GET',
  url = '/',
  body = null,
} = {}) {
  const req = Readable.from(
    body === null ? [] : [Buffer.from(body)]
  );
  req.method = method;
  req.url = url;
  return req;
}

function createResponse() {
  const capture = {
    statusCode: null,
    headers: {},
    payload: null,
  };

  return {
    capture,
    res: {
      setHeader(name, value) {
        capture.headers[name] = value;
      },
      end(value) {
        capture.payload = JSON.parse(value);
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

test('health confirma generación real disponible', async () => {
  const handler = createInternalDesignApi({
    designEngine: { async execute() { return {}; } },
  });
  const { capture, res } = createResponse();

  const handled = await handler(
    createRequest({ url: '/health' }),
    res
  );

  assert.equal(handled, true);
  assert.equal(capture.statusCode, 200);
  assert.equal(capture.payload.status, 'OK');
  assert.equal(capture.payload.realImageGenerationEnabled, true);
});

test('/internal/design devuelve PROCESSED con asset', async () => {
  const assetId = '33333333-3333-4333-8333-333333333333';
  const handler = createInternalDesignApi({
    designEngine: {
      async execute(input) {
        assert.equal(input.actor.source, 'ELAN_IA');
        return {
          designId: assetId,
          status: 'PROCESSED',
          assets: [{
            id: assetId,
            type: 'IMAGE',
            mimeType: 'image/png',
            platform: 'ELANVISUAL',
            url: `https://orchestrator.elankav.com/api/design-assets/${assetId}`,
          }],
          qa: { approved: true },
          elanIaResult: {
            clientReady: true,
            conversational: false,
          },
        };
      },
    },
  });
  const { capture, res } = createResponse();

  await handler(
    createRequest({
      method: 'POST',
      url: '/internal/design',
      body: JSON.stringify({
        requestId: 'REQ-API-001',
        actor: { source: 'ELAN_IA' },
        platform: 'ELANVISUAL',
        projectType: 'Rótulo exterior',
        measurementStatus: 'MISSING',
        instructions: ['Fondo negro'],
        directClientConversation: false,
      }),
    }),
    res
  );

  assert.equal(capture.statusCode, 200);
  assert.equal(capture.payload.success, true);
  assert.equal(capture.payload.result.status, 'PROCESSED');
  assert.equal(capture.payload.result.assets.length, 1);
  assert.equal(capture.payload.result.elanIaResult.clientReady, true);
  assert.equal(capture.payload.result.elanIaResult.conversational, false);
});

test('rechaza entrada que no proviene de ELAN IA', async () => {
  const handler = createInternalDesignApi();
  const { capture, res } = createResponse();

  await handler(
    createRequest({
      method: 'POST',
      url: '/internal/design',
      body: JSON.stringify({
        actor: { source: 'CLIENT' },
        platform: 'ELANVISUAL',
        measurementStatus: 'MISSING',
      }),
    }),
    res
  );

  assert.equal(capture.statusCode, 422);
  assert.equal(capture.payload.error, 'INVALID_ENTRY_SOURCE');
});

test('conversación directa continúa prohibida', async () => {
  const handler = createInternalDesignApi();
  const { capture, res } = createResponse();

  await handler(
    createRequest({
      method: 'POST',
      url: '/internal/design',
      body: JSON.stringify({
        actor: { source: 'ELAN_IA' },
        platform: 'ELANVISUAL',
        measurementStatus: 'MISSING',
        directClientConversation: true,
      }),
    }),
    res
  );

  assert.equal(capture.statusCode, 422);
  assert.equal(
    capture.payload.error,
    'DIRECT_CLIENT_CONVERSATION_FORBIDDEN'
  );
});

test('rechaza JSON inválido', async () => {
  const handler = createInternalDesignApi();
  const { capture, res } = createResponse();

  await handler(
    createRequest({
      method: 'POST',
      url: '/internal/design',
      body: '{invalid',
    }),
    res
  );

  assert.equal(capture.statusCode, 400);
  assert.equal(capture.payload.error, 'INVALID_JSON');
});

test('devuelve false para rutas no reconocidas', async () => {
  const handler = createInternalDesignApi();
  const { res } = createResponse();
  const handled = await handler(
    createRequest({ url: '/unknown' }),
    res
  );
  assert.equal(handled, false);
});
