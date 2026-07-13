'use strict';

const { BaseAdapter } = require('../base/BaseAdapter');

class VoiceAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({
      name: 'voice-adapter',
      category: 'voice',
      configured: false,
      ...options,
    });
  }
}

module.exports = {
  VoiceAdapter,
};
