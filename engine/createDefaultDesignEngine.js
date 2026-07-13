'use strict';

const { DesignEngine } = require('./DesignEngine');
const {
  DesignRequestService
} = require('../services/designRequestService');

function createDefaultDesignEngine() {
  return new DesignEngine({
    designRequestService: new DesignRequestService()
  });
}

module.exports = {
  createDefaultDesignEngine
};
