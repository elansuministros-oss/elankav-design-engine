'use strict';

const { BaseAdapter } = require('../base/BaseAdapter');

class StorageAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({
      name: 'storage-adapter',
      category: 'storage',
      configured: false,
      ...options,
    });
  }
}

module.exports = {
  StorageAdapter,
};
