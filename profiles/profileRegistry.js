'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

class ProfileRegistry {
  constructor(initialProfiles = []) {
    this.profiles = new Map();

    for (const profile of initialProfiles) {
      this.register(profile);
    }
  }

  register(profile) {
    if (!profile || typeof profile !== 'object') {
      throw new DesignEngineError(
        'INVALID_PROFILE',
        'El perfil debe ser un objeto.'
      );
    }

    if (!profile.id || !profile.version || !profile.category) {
      throw new DesignEngineError(
        'INVALID_PROFILE',
        'El perfil requiere id, version y category.'
      );
    }

    const key = `${profile.id}@${profile.version}`;

    if (this.profiles.has(key)) {
      throw new DesignEngineError(
        'DUPLICATE_PROFILE',
        `El perfil ${key} ya está registrado.`
      );
    }

    this.profiles.set(key, Object.freeze({ ...profile }));
    return this.profiles.get(key);
  }

  get(id, version) {
    const key = `${id}@${version}`;
    const profile = this.profiles.get(key);

    if (!profile) {
      throw new DesignEngineError(
        'PROFILE_NOT_FOUND',
        `No existe el perfil ${key}.`,
        { id, version }
      );
    }

    return profile;
  }

  list() {
    return Array.from(this.profiles.values());
  }
}

module.exports = {
  ProfileRegistry,
};
