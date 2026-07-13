'use strict';

class DesignEngineError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'DesignEngineError';
    this.code = code;
    this.details = details;
  }
}

module.exports = {
  DesignEngineError,
};
