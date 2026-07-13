'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DesignRequestService,
} = require('../services/designRequestService');

function createValidRequest(overrides = {}) {
  return {
    requestId: 'REQ-001',
    actor: {
      source: 'ELAN_IA',
      id: 'elan-ia',
      role: 'SYSTEM',
    },
    client: {
      id: 'CLIENT-001',
      name: 'Cliente de prueba',
    },
    platform: 'ELANVISUAL',
    channel: 'INTERNAL',
    projectType: 'SIGNAGE_REQUEST',
    measurements: [
      {
        name: 'ancho',
        value: 60,
        unit: 'cm',
      },
      {
        name: 'alto',
        value: 60,
        unit: 'cm',
      },
    ],
    measurementStatus: 'CONFIRMED',
    environment: 'EXTERIOR',
    brandAssets: [],
    references: [],
    instructions: [],
    proposalConsumed: 0,
    outputLevel: 'PLAN',
    costAuthorization: {
      authorized: false,
      authorizationId: null,
    },
    directClientConversation: false,
    ...overrides,
  };
}

test('acepta una solicitud válida proveniente de ELAN IA', () => {
  const service = new DesignRequestService();
  const result = service.validate(createValidRequest());

  assert.equal(result.requestId, 'REQ-001');
  assert.equal(result.platform, 'ELANVISUAL');
  assert.equal(result.actor.source, 'ELAN_IA');
});

test('rechaza una solicitud sin plataforma', () => {
  const service = new DesignRequestService();
  const request = createValidRequest({ platform: '' });

  assert.throws(
    () => service.validate(request),
    (error) => error.code === 'PLATFORM_REQUIRED'
  );
});

test('acepta medidas confirmadas cuando existen valores', () => {
  const service = new DesignRequestService();
  const request = createValidRequest({
    measurementStatus: 'CONFIRMED',
  });

  const result = service.validate(request);

  assert.equal(result.measurementStatus, 'CONFIRMED');
  assert.equal(result.measurements.length, 2);
});

test('acepta medidas estimadas sin convertirlas en confirmadas', () => {
  const service = new DesignRequestService();
  const request = createValidRequest({
    measurementStatus: 'ESTIMATED',
    measurements: [
      {
        name: 'ancho_estimado',
        value: 1.5,
        unit: 'm',
      },
    ],
  });

  const result = service.validate(request);

  assert.equal(result.measurementStatus, 'ESTIMATED');
  assert.notEqual(result.measurementStatus, 'CONFIRMED');
});

test('prohíbe conversación directa con el cliente', () => {
  const service = new DesignRequestService();
  const request = createValidRequest({
    directClientConversation: true,
  });

  assert.throws(
    () => service.validate(request),
    (error) =>
      error.code === 'DIRECT_CLIENT_CONVERSATION_FORBIDDEN'
  );
});
