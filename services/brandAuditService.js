'use strict';

class BrandAuditService {
  audit(request = {}) {
    const assets = Array.isArray(request.brandAssets)
      ? request.brandAssets
      : [];

    const approvedAssets = assets.filter(
      (asset) => asset.approved === true
    );

    return {
      platform: request.platform || null,
      hasBrandAssets: assets.length > 0,
      hasApprovedBrandAssets: approvedAssets.length > 0,
      approvedAssets,
      requiresBrandWork:
        request.projectType !== 'BRAND_REQUEST' &&
        approvedAssets.length === 0,
    };
  }
}

module.exports = {
  BrandAuditService,
};
