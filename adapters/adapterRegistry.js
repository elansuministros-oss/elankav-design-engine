'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

const VALID_ROUTES = new Set([
  'image',
  'video',
  'voice',
  'storage',
  'delivery',
]);

class AdapterRegistry {
  constructor() {
    this.adapters = new Map();
  }

  register(route, adapter) {
    if (!VALID_ROUTES.has(route)) {
      throw new DesignEngineError(
        'INVALID_ROUTE',
        `La ruta de adapter ${route} no está permitida.`,
        { route }
      );
    }

    if (!adapter || typeof adapter.execute !== 'function') {
      throw new DesignEngineError(
        'INVALID_ADAPTER',
        'El adapter debe implementar execute().',
        { route }
      );
    }

    this.adapters.set(route, adapter);
    return adapter;
  }

  get(route) {
    if (!VALID_ROUTES.has(route)) {
      throw new DesignEngineError(
        'INVALID_ROUTE',
        `La ruta de adapter ${route} no está permitida.`,
        { route }
      );
    }

    const adapter = this.adapters.get(route);

    if (!adapter) {
      throw new DesignEngineError(
        'ADAPTER_NOT_CONFIGURED',
        `No existe un adapter configurado para ${route}.`,
        { route }
      );
    }

    return adapter;
  }
}

module.exports = {
  AdapterRegistry,
  VALID_ROUTES,
};
