'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

class PlatformBrandingService {
  constructor(profiles = []) {
    this.profiles = new Map();

    for (const profile of profiles) {
      this.register(profile);
    }
  }

  register(profile) {
    if (!profile || typeof profile !== 'object' || !profile.platform) {
      throw new DesignEngineError(
        'INVALID_PLATFORM_BRAND_PROFILE',
        'El perfil de marca requiere una plataforma válida.'
      );
    }

    if (this.profiles.has(profile.platform)) {
      throw new DesignEngineError(
        'DUPLICATE_PLATFORM_BRAND_PROFILE',
        `La plataforma ${profile.platform} ya está registrada.`
      );
    }

    const normalized = Object.freeze({
      ...profile,
      commercialData: Object.freeze({
        ...(profile.commercialData || {}),
      }),
    });

    this.profiles.set(profile.platform, normalized);

    return normalized;
  }

  resolve(platform) {
    if (!platform) {
      throw new DesignEngineError(
        'PLATFORM_REQUIRED',
        'La plataforma es obligatoria.'
      );
    }

    const profile = this.profiles.get(platform);

    if (!profile) {
      throw new DesignEngineError(
        'PLATFORM_BRAND_PROFILE_NOT_FOUND',
        `No existe branding configurado para ${platform}.`,
        { platform }
      );
    }

    return profile;
  }
}

module.exports = {
  PlatformBrandingService,
};
