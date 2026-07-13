'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { AdapterRegistry } = require('../adapters/adapterRegistry');
const { ImageAdapter } = require('../adapters/image/ImageAdapter');
const { VideoAdapter } = require('../adapters/video/VideoAdapter');
const { VoiceAdapter } = require('../adapters/voice/VoiceAdapter');
const { StorageAdapter } = require('../adapters/storage/StorageAdapter');
const { DeliveryAdapter } = require('../adapters/delivery/DeliveryAdapter');

test('rechaza ejecución de adapter no configurado', async () => {
  const adapter = new ImageAdapter();

  await assert.rejects(
    () => adapter.execute(),
    (error) => error.code === 'ADAPTER_NOT_CONFIGURED'
  );
});

test('rechaza rutas inválidas', () => {
  const registry = new AdapterRegistry();

  assert.throws(
    () => registry.get('supabase-direct'),
    (error) => error.code === 'INVALID_ROUTE'
  );
});

test('registra únicamente las cinco categorías autorizadas', () => {
  const registry = new AdapterRegistry();

  registry.register('image', new ImageAdapter());
  registry.register('video', new VideoAdapter());
  registry.register('voice', new VoiceAdapter());
  registry.register('storage', new StorageAdapter());
  registry.register('delivery', new DeliveryAdapter());

  assert.equal(registry.get('image').category, 'image');
  assert.equal(registry.get('video').category, 'video');
  assert.equal(registry.get('voice').category, 'voice');
  assert.equal(registry.get('storage').category, 'storage');
  assert.equal(registry.get('delivery').category, 'delivery');
});

test('los adapters permanecen sin proveedores externos', () => {
  const adapters = [
    new ImageAdapter(),
    new VideoAdapter(),
    new VoiceAdapter(),
    new StorageAdapter(),
    new DeliveryAdapter(),
  ];

  assert.equal(
    adapters.every((adapter) => adapter.configured === false),
    true
  );
});
