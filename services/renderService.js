'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

class RenderService {
  constructor({ imageAdapter = null } = {}) {
    this.imageAdapter = imageAdapter;
  }

  async execute({ request, plan } = {}) {
    if (!request || !plan) {
      throw new DesignEngineError(
        'RENDER_INPUT_REQUIRED',
        'Render Service requiere solicitud y plan.'
      );
    }

    if (!this.imageAdapter) {
      return {
        status: 'NOT_GENERATED',
        assets: [],
        providerConfigured: false,
        platform: request.platform,
      };
    }

    return this.imageAdapter.execute({
      request,
      plan,
    });
  }
}

module.exports = {
  RenderService,
};
