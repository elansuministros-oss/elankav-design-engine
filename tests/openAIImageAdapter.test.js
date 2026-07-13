'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  OpenAIImageAdapter,
} = require('../adapters/image/OpenAIImageAdapter');

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() {
      return payload;
    },
  };
}

test('adapter rechaza falta de clave', async () => {
  const adapter = new OpenAIImageAdapter({
    apiKey: '',
    fetchImpl: async () => {
      throw new Error('no debe llamarse');
    },
  });

  await assert.rejects(
    adapter.generateImage({ prompt: 'Rótulo', requestId: 'REQ-1' }),
    { code: 'OPENAI_IMAGE_NOT_CONFIGURED' }
  );
});

test('adapter usa modelo configurable y procesa b64_json', async () => {
  let sentBody;
  const source = Buffer.from('png-test');
  const adapter = new OpenAIImageAdapter({
    apiKey: 'test-key',
    model: 'image-model-test',
    fetchImpl: async (_url, options) => {
      sentBody = JSON.parse(options.body);
      return jsonResponse({
        data: [{ b64_json: source.toString('base64') }],
        usage: { total_tokens: 1 },
      });
    },
  });

  const result = await adapter.generateImage({
    prompt: 'Propuesta visual sin precios',
    requestId: 'REQ-2',
    platform: 'ELANVISUAL',
  });

  assert.equal(sentBody.model, 'image-model-test');
  assert.equal(sentBody.response_format, 'b64_json');
  assert.equal(result.model, 'image-model-test');
  assert.equal(result.mimeType, 'image/png');
  assert.deepEqual(result.buffer, source);
  assert.equal(result.bytes, source.length);
});

test('adapter rechaza respuesta sin imagen', async () => {
  const adapter = new OpenAIImageAdapter({
    apiKey: 'test-key',
    fetchImpl: async () => jsonResponse({ data: [{}] }),
  });

  await assert.rejects(
    adapter.generateImage({ prompt: 'Rótulo', requestId: 'REQ-3' }),
    { code: 'OPENAI_IMAGE_INVALID_RESPONSE' }
  );
});

test('adapter controla timeout', async () => {
  const adapter = new OpenAIImageAdapter({
    apiKey: 'test-key',
    timeoutMs: 5,
    fetchImpl: async (_url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    }),
  });

  await assert.rejects(
    adapter.generateImage({ prompt: 'Rótulo', requestId: 'REQ-4' }),
    { code: 'OPENAI_IMAGE_TIMEOUT' }
  );
});

test('adapter distingue moderación', async () => {
  const adapter = new OpenAIImageAdapter({
    apiKey: 'test-key',
    fetchImpl: async () => jsonResponse({
      error: {
        code: 'content_policy_violation',
        message: 'Rejected by safety system',
      },
    }, { ok: false, status: 400 }),
  });

  await assert.rejects(
    adapter.generateImage({ prompt: 'Rótulo', requestId: 'REQ-5' }),
    { code: 'OPENAI_IMAGE_MODERATION_REJECTED' }
  );
});
