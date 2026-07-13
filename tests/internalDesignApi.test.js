'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');

const {
  createInternalDesignApi
} = require('../api/internalDesignApi');

function createRequest({
  method = 'GET',
  url = '/',
  body = null
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
    payload: null
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
      }
    }
  };
}

test('health confirma motor disponible sin proveedores externos', async () => {
  const handler = createInternalDesignApi();
  const { capture, res } = createResponse();

  const handled = await handler(
    createRequest({ url: '/health' }),
    res
  );

  assert.equal(handled, true);
  assert.equal(capture.statusCode, 200);
  assert.equal(capture.payload.status, 'OK');
  assert.equal(
    capture.payload.externalProvidersEnabled,
    false
  );
});

test('acepta solicitud estructurada proveniente de ELAN IA', async () => {
  const handler = createInternalDesignApi();
  const { capture, res } = createResponse();

  await handler(
    createRequest({
      method: 'POST',
      url: '/internal/design',
      body: JSON.stringify({
        requestId: 'REQ-API-001',
        actor: { source: 'ELAN_IA' },
        platform: 'ELANVISUAL',
        measurementStatus: 'MISSING',
        measurements: [],
        directClientConversation: false
      })
    }),
    res
  );

  assert.equal(capture.statusCode, 200);
  assert.equal(capture.payload.success, true);
  assert.equal(capture.payload.result.status, 'PLANNED');
  assert.equal(
    capture.payload.result.elanIaResult.conversational,
    false
  );
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
        measurementStatus: 'MISSING'
      })
    }),
    res
  );

  assert.equal(capture.statusCode, 422);
  assert.equal(
    capture.payload.error,
    'INVALID_ENTRY_SOURCE'
  );
});

test('rechaza JSON inválido', async () => {
  const handler = createInternalDesignApi();
  const { capture, res } = createResponse();

  await handler(
    createRequest({
      method: 'POST',
      url: '/internal/design',
      body: '{invalid'
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
