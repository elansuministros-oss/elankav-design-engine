'use strict';

const { BaseAdapter } = require('../base/BaseAdapter');

class ImageAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({
      name: 'image-adapter',
      category: 'image',
      configured: false,
      ...options,
    });
  }
}

module.exports = {
  ImageAdapter,
};
