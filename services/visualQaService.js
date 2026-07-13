'use strict';

const { PRICE_PATTERN } = require('./promptBuilderService');

class VisualQaService {
  evaluate({ request, plan = null, render } = {}) {
    const assets = Array.isArray(render?.assets)
      ? render.assets
      : [];
    const prompt = render?.prompt;
    const confirmedMeasurements =
      request?.measurementStatus === 'CONFIRMED'
        ? request.measurements || []
        : [];

    const checks = [
      {
        code: 'EXACTLY_ONE_ASSET',
        passed: assets.length === 1,
      },
      {
        code: 'ASSET_NOT_EMPTY',
        passed:
          assets.length === 1 &&
          Number(assets[0]?.bytes || render?.localAsset?.bytes) > 0,
      },
      {
        code: 'MIME_ALLOWED',
        passed:
          assets.length === 1 &&
          assets[0]?.mimeType === 'image/png',
      },
      {
        code: 'PLATFORM_MATCH',
        passed:
          Boolean(request?.platform) &&
          assets.length === 1 &&
          assets[0]?.platform === request.platform &&
          (!plan?.branding?.platform ||
            plan.branding.platform === request.platform),
      },
      {
        code: 'DIRECT_CLIENT_CONVERSATION_FORBIDDEN',
        passed:
          request?.directClientConversation !== true &&
          prompt?.conversational === false &&
          plan?.conversational !== true,
      },
      {
        code: 'PRICE_IN_PROMPT_FORBIDDEN',
        passed:
          typeof prompt?.content === 'string' &&
          !PRICE_PATTERN.test(prompt.content),
      },
      {
        code: 'CONFIRMED_MEASUREMENTS_PRESERVED',
        passed:
          request?.measurementStatus !== 'CONFIRMED' ||
          (
            confirmedMeasurements.length > 0 &&
            JSON.stringify(prompt?.metadata?.confirmedMeasurements || []) ===
              JSON.stringify(confirmedMeasurements)
          ),
      },
      {
        code: 'RESULT_PLATFORM_SEPARATION',
        passed: assets.every(
          (asset) => asset.platform === request?.platform
        ),
      },
    ];

    const errors = checks
      .filter((check) => !check.passed)
      .map((check) => check.code);

    return {
      approved: errors.length === 0,
      inspectionDepth: 'STRUCTURAL_MINIMUM',
      checks,
      warnings: [
        'DESIGN-003A no implementa inspección visual profunda del contenido del PNG.',
      ],
      errors,
    };
  }
}

module.exports = {
  VisualQaService,
};
