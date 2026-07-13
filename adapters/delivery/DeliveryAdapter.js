'use strict';

const { BaseAdapter } = require('../base/BaseAdapter');

class DeliveryAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({
      name: 'delivery-adapter',
      category: 'delivery',
      configured: false,
      ...options,
    });
  }
}

module.exports = {
  DeliveryAdapter,
};
