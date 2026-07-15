'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ReferenceImageAdapter,
  decodeInlineImage,
} = require('../adapters/image/ReferenceImageAdapter');

function imageResponse(buffer, mimeType = 'image/jpeg') {
  return {
    ok: true,
    status: 200,
    headers: new Headers({
      'content-type': mimeType,
      'content-length': String(buffer.length),
    }),
    async arrayBuffer() {
      return buffer;
    },
  };
}

test('descarga referencia únicamente desde host y ruta autorizados', async () => {
  const source = Buffer.from('image-reference');
  const adapter = new ReferenceImageAdapter({
    allowedHosts: ['media.elankav.test'],
    fetchImpl: async url => {
      assert.equal(url.hostname, 'media.elankav.test');
      return imageResponse(source);
    },
  });

  const result = await adapter.download({
    url: 'https://media.elankav.test/api/whatsapp-media?signature=test',
    fileName: 'reference.jpg',
  });

  assert.deepEqual(result.buffer, source);
  assert.equal(result.mimeType, 'image/jpeg');
});

test('acepta referencia interna base64 con límites y formato estricto', async () => {
  const source = Buffer.from('inline-reference');
  const dataUrl = `data:image/png;base64,${source.toString('base64')}`;
  const decoded = decodeInlineImage({
    dataUrl,
    fileName: 'logo.png',
  });

  assert.deepEqual(decoded.buffer, source);
  assert.equal(decoded.mimeType, 'image/png');
  assert.equal(decoded.fileName, 'logo.png');

  const adapter = new ReferenceImageAdapter({ maxBytes: 4 });
  await assert.rejects(
    () => adapter.download({ dataUrl }),
    { code: 'REFERENCE_IMAGE_SIZE_EXCEEDED' }
  );
});

test('bloquea host arbitrario y archivo demasiado grande', async () => {
  const adapter = new ReferenceImageAdapter({
    allowedHosts: ['media.elankav.test'],
    maxBytes: 4,
    fetchImpl: async () => imageResponse(Buffer.from('12345')),
  });

  await assert.rejects(
    () => adapter.download({ url: 'https://attacker.test/api/whatsapp-media' }),
    { code: 'REFERENCE_IMAGE_URL_REJECTED' }
  );

  await assert.rejects(
    () => adapter.download({
      url: 'https://media.elankav.test/api/whatsapp-media?signature=test'
    }),
    { code: 'REFERENCE_IMAGE_SIZE_EXCEEDED' }
  );
});
