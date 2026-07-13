'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { RenderService } = require('../services/renderService');
const { PromptBuilderService } = require('../services/promptBuilderService');

const FIXED_ID = '11111111-1111-4111-8111-111111111111';

function createFsMock() {
  const writes = [];
  return {
    writes,
    async mkdir(directory) {
      this.directory = directory;
    },
    async writeFile(filePath, buffer, options) {
      writes.push({ filePath, buffer, options });
    },
  };
}

test('render guarda PNG fuera del repositorio y devuelve asset', async () => {
  const fsMock = createFsMock();
  const outputDir = '/var/lib/elankav/design-engine/renders';
  const service = new RenderService({
    promptBuilderService: new PromptBuilderService(),
    imageAdapter: {
      async generateImage() {
        return {
          provider: 'openai',
          model: 'image-test',
          mimeType: 'image/png',
          buffer: Buffer.from('png-real'),
        };
      },
    },
    outputDir,
    publicBaseUrl: 'https://orchestrator.elankav.com/api/design-assets',
    fsImpl: fsMock,
    idFactory: () => FIXED_ID,
  });

  const result = await service.execute({
    request: {
      requestId: 'REQ-RENDER-1',
      platform: 'ELANVISUAL',
      projectType: 'Rótulo exterior',
      environment: 'EXTERIOR',
      measurementStatus: 'MISSING',
      measurements: [],
      instructions: ['Fondo negro', 'Letras blancas'],
    },
  });

  assert.equal(result.status, 'PROCESSED');
  assert.equal(result.assets.length, 1);
  assert.equal(result.assets[0].id, FIXED_ID);
  assert.equal(result.assets[0].platform, 'ELANVISUAL');
  assert.match(fsMock.writes[0].filePath, /^\/var\/lib\/elankav\/design-engine\/renders\//);
  assert.equal(fsMock.writes[0].filePath.includes('/opt/elankav/'), false);
});

test('render no consume generación cuando faltan datos críticos', async () => {
  let called = false;
  const service = new RenderService({
    promptBuilderService: new PromptBuilderService(),
    imageAdapter: {
      async generateImage() {
        called = true;
        throw new Error('no debe llamarse');
      },
    },
    fsImpl: createFsMock(),
  });

  const result = await service.execute({
    request: {
      requestId: 'REQ-RENDER-2',
      platform: 'ELANVISUAL',
      measurementStatus: 'MISSING',
      measurements: [],
    },
  });

  assert.equal(result.status, 'NEEDS_INFORMATION');
  assert.equal(result.assets.length, 0);
  assert.equal(called, false);
});

test('prompt conserva medidas confirmadas y excluye precios', () => {
  const builder = new PromptBuilderService();
  const measurements = [{ width: 1.5, unit: 'm' }];
  const prompt = builder.build({
    request: {
      requestId: 'REQ-PROMPT-1',
      platform: 'ELANVISUAL',
      projectType: 'Rótulo',
      measurementStatus: 'CONFIRMED',
      measurements,
      instructions: ['Letras corpóreas'],
    },
  });

  assert.equal(prompt.type, 'DESIGN_PROMPT');
  assert.deepEqual(prompt.metadata.confirmedMeasurements, measurements);
  assert.doesNotMatch(prompt.content, /USD|NIO|C\$|U\$|\$\s*\d/i);
  assert.match(prompt.content, /1\.5/);
});
