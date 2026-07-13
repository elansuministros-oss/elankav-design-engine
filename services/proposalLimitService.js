'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

class ProposalLimitService {
  constructor({ includedProposals = 3 } = {}) {
    this.includedProposals = includedProposals;
  }

  evaluate({
    proposalConsumed = 0,
    authorization = null,
  } = {}) {
    if (!Number.isInteger(proposalConsumed) || proposalConsumed < 0) {
      throw new DesignEngineError(
        'INVALID_PROPOSAL_COUNT',
        'La cantidad de propuestas consumidas no es válida.'
      );
    }

    if (proposalConsumed < this.includedProposals) {
      return {
        allowed: true,
        authorizationUsed: false,
        remainingIncluded:
          this.includedProposals - proposalConsumed,
      };
    }

    if (!authorization) {
      throw new DesignEngineError(
        'PROPOSAL_LIMIT_REACHED',
        'Las tres propuestas incluidas ya fueron utilizadas.'
      );
    }

    this.validateAuthorization(authorization);

    return {
      allowed: true,
      authorizationUsed: true,
      remainingIncluded: 0,
      authorizationId: authorization.authorizationId,
    };
  }

  validateAuthorization(authorization) {
    const required = [
      'authorizationId',
      'projectId',
      'clientId',
      'administratorId',
      'administratorIdentity',
      'reason',
      'additionalQuantity',
      'authorizedAt',
      'audit',
    ];

    const missing = required.filter(
      (field) =>
        authorization[field] === undefined ||
        authorization[field] === null ||
        authorization[field] === ''
    );

    if (missing.length > 0) {
      throw new DesignEngineError(
        'ADMIN_AUTHORIZATION_REQUIRED',
        'La autorización administrativa está incompleta.',
        { missing }
      );
    }

    if (
      !Number.isInteger(authorization.additionalQuantity) ||
      authorization.additionalQuantity < 1
    ) {
      throw new DesignEngineError(
        'INVALID_ADMIN_AUTHORIZATION',
        'La cantidad adicional autorizada no es válida.'
      );
    }

    return true;
  }
}

module.exports = {
  ProposalLimitService,
};
