'use strict';

const { BaseAdapter } = require('../base/BaseAdapter');

class VideoAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({
      name: 'video-adapter',
      category: 'video',
      configured: false,
      ...options,
    });
  }
}

module.exports = {
  VideoAdapter,
};
