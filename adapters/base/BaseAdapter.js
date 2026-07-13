'use strict';

const { DesignEngineError } = require('../../errors/DesignEngineError');

class BaseAdapter {
  constructor({ name, category, configured = false } = {}) {
    this.name = name || 'unconfigured-adapter';
    this.category = category || 'unknown';
    this.configured = configured === true;
  }

  assertConfigured() {
    if (!this.configured) {
      throw new DesignEngineError(
        'ADAPTER_NOT_CONFIGURED',
        `El adapter ${this.name} no está configurado.`,
        {
          adapter: this.name,
          category: this.category,
        }
      );
    }
  }

  async execute() {
    this.assertConfigured();

    throw new DesignEngineError(
      'ADAPTER_NOT_IMPLEMENTED',
      `El adapter ${this.name} no tiene implementación externa.`,
      {
        adapter: this.name,
        category: this.category,
      }
    );
  }
}

module.exports = {
  BaseAdapter,
};
