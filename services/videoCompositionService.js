'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

class VideoCompositionService {
  constructor({ videoAdapter = null } = {}) {
    this.videoAdapter = videoAdapter;
  }

  async execute(input = {}) {
    if (!input.request) {
      throw new DesignEngineError(
        'VIDEO_INPUT_REQUIRED',
        'Video Composition requiere una solicitud.'
      );
    }

    if (!this.videoAdapter) {
      return {
        status: 'NOT_GENERATED',
        assets: [],
        providerConfigured: false,
        platform: input.request.platform,
      };
    }

    return this.videoAdapter.execute(input);
  }
}

module.exports = {
  VideoCompositionService,
};
