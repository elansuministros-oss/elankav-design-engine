'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ProposalLimitService,
} = require('../services/proposalLimitService');

function createAuthorization(overrides = {}) {
  return {
    authorizationId: 'AUTH-001',
    projectId: 'PROJECT-001',
    clientId: 'CLIENT-001',
    administratorId: 'ADMIN-001',
    administratorIdentity: '+50570000000',
    reason: 'Propuesta adicional autorizada',
    additionalQuantity: 1,
    authorizedAt: '2026-07-13T01:00:00.000Z',
    audit: {
      source: 'OWNER_MODE',
      traceId: 'TRACE-001',
    },
    ...overrides,
  };
}

test('permite propuestas dentro del límite incluido', () => {
  const service = new ProposalLimitService();

  const result = service.evaluate({
    proposalConsumed: 2,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.authorizationUsed, false);
  assert.equal(result.remainingIncluded, 1);
});

test('bloquea una cuarta propuesta sin autorización', () => {
  const service = new ProposalLimitService();

  assert.throws(
    () =>
      service.evaluate({
        proposalConsumed: 3,
      }),
    (error) => error.code === 'PROPOSAL_LIMIT_REACHED'
  );
});

test('permite propuesta adicional con autorización administrativa válida', () => {
  const service = new ProposalLimitService();

  const result = service.evaluate({
    proposalConsumed: 3,
    authorization: createAuthorization(),
  });

  assert.equal(result.allowed, true);
  assert.equal(result.authorizationUsed, true);
  assert.equal(result.authorizationId, 'AUTH-001');
});

test('rechaza autorización administrativa incompleta', () => {
  const service = new ProposalLimitService();

  assert.throws(
    () =>
      service.evaluate({
        proposalConsumed: 3,
        authorization: createAuthorization({
          administratorIdentity: '',
        }),
      }),
    (error) => error.code === 'ADMIN_AUTHORIZATION_REQUIRED'
  );
});
