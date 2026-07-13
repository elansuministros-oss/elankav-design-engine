'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DesignEngine } = require('../engine/DesignEngine');

function createRequest(overrides = {}) {
  return {
    requestId: 'REQ-ENGINE-001',
    actor: {
      source: 'ELAN_IA',
      id: 'elan-ia',
      role: 'SYSTEM',
    },
    client: {
      id: 'CLIENT-001',
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

test('devuelve un DesignResult estructurado exclusivamente para ELAN IA', async () => {
  const engine = new DesignEngine({
    designRequestService: {
      validate(input) {
        return input;
      },
    },
    designPlannerService: {
      plan(request) {
        return {
          profile: {
            id: 'SIGNAGE-BASE',
            version: '1.0.0',
          },
          branding: {
            platform: request.platform,
          },
          conversational: false,
        };
      },
    },
    renderService: {
      execute({ request }) {
        return {
          assets: [
            {
              id: 'ASSET-001',
              type: 'PLAN',
              platform: request.platform,
            },
          ],
        };
      },
    },
    visualQaService: {
      evaluate() {
        return {
          approved: true,
          checks: [],
          warnings: [],
          errors: [],
        };
      },
    },
  });

  const result = await engine.execute(createRequest());

  assert.equal(result.status, 'PROCESSED');
  assert.equal(result.platform, 'ELANVISUAL');
  assert.equal(result.profile.id, 'SIGNAGE-BASE');
  assert.equal(result.assets.length, 1);
  assert.equal(result.qa.approved, true);

  assert.deepEqual(result.elanIaResult, {
    type: 'DESIGN_RESULT',
    conversational: false,
    clientReady: true,
  });
});

test('el resultado nunca habilita conversación directa', async () => {
  const engine = new DesignEngine({
    designRequestService: {
      validate(input) {
        return input;
      },
    },
  });

  const result = await engine.execute(createRequest());

  assert.equal(result.elanIaResult.conversational, false);
});

test('bloquea solicitudes que no provienen de ELAN IA', async () => {
  const engine = new DesignEngine({
    designRequestService: {
      validate(input) {
        return input;
      },
    },
  });

  await assert.rejects(
    () =>
      engine.execute(
        createRequest({
          actor: {
            source: 'EXTERNAL_PROVIDER',
            id: 'provider',
            role: 'SYSTEM',
          },
        })
      ),
    (error) => error.code === 'INVALID_ENTRY_SOURCE'
  );
});
