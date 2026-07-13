'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

const PRICE_PATTERN =
  /(?:USD|NIO|C\$|U\$|\$)\s*\d+(?:[.,]\d+)?/i;

class PromptBuilderService {
  build({ request, plan } = {}) {
    if (!request || !plan) {
      throw new DesignEngineError(
        'PROMPT_INPUT_REQUIRED',
        'Prompt Builder requiere solicitud y plan.'
      );
    }

    const instructions = Array.isArray(
      request.instructions
    )
      ? request.instructions
      : [];

    const content = [
      `projectType=${request.projectType}`,
      `platform=${request.platform}`,
      `environment=${request.environment}`,
      `measurementStatus=${request.measurementStatus}`,
      `profile=${plan.profile?.id || 'UNDEFINED'}`,
      ...instructions,
    ].join('\n');

    if (PRICE_PATTERN.test(content)) {
      throw new DesignEngineError(
        'PRICE_IN_PROMPT_FORBIDDEN',
        'Los precios no pueden incluirse dentro del prompt.'
      );
    }

    return {
      type: 'DESIGN_PROMPT',
      conversational: false,
      content,
      metadata: {
        requestId: request.requestId,
        platform: request.platform,
        profileId: plan.profile?.id || null,
      },
    };
  }
}

module.exports = {
  PromptBuilderService,
};
