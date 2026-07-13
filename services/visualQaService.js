'use strict';

class VisualQaService {
  evaluate({ request, plan, render } = {}) {
    const assets = Array.isArray(render?.assets)
      ? render.assets
      : [];

    const checks = [
      {
        code: 'PLATFORM_MATCH',
        passed:
          Boolean(request?.platform) &&
          plan?.branding?.platform === request.platform,
      },
      {
        code: 'PROFILE_SELECTED',
        passed: Boolean(plan?.profile),
      },
      {
        code: 'DIRECT_CLIENT_CONVERSATION_FORBIDDEN',
        passed:
          request?.directClientConversation !== true &&
          plan?.conversational === false,
      },
      {
        code: 'ASSET_PLATFORM_SEPARATION',
        passed: assets.every(
          (asset) =>
            !asset.platform ||
            asset.platform === request?.platform
        ),
      },
    ];

    const errors = checks
      .filter((check) => !check.passed)
      .map((check) => check.code);

    return {
      approved: errors.length === 0,
      checks,
      warnings: [],
      errors,
    };
  }
}

module.exports = {
  VisualQaService,
};
