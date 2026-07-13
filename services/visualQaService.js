'use strict';

const { PRICE_PATTERN } = require('./promptBuilderService');

class VisualQaService {
  evaluate({ request, plan = null, render } = {}) {
    const assets = Array.isArray(render?.assets)
      ? render.assets
      : [];
    const prompt = render?.prompt;
    const asset = assets[0] || null;
    const confirmedMeasurements =
      request?.measurementStatus === 'CONFIRMED'
        ? request.measurements || []
        : [];

    // DESIGN-002A ya utilizaba VisualQaService para resultados
    // estructurales sin archivo binario. DESIGN-003A aplica los controles
    // estrictos únicamente cuando el resultado representa una imagen real.
    const isImageRender = Boolean(
      asset?.type === 'IMAGE' ||
      asset?.mimeType ||
      render?.localAsset
    );

    const checks = [
      {
        code: 'EXACTLY_ONE_ASSET',
        passed: assets.length === 1,
      },
      {
        code: 'PLATFORM_MATCH',
        passed:
          Boolean(request?.platform) &&
          (!plan?.branding?.platform ||
            plan.branding.platform === request.platform),
      },
      {
        code: 'DIRECT_CLIENT_CONVERSATION_FORBIDDEN',
        passed:
          request?.directClientConversation !== true &&
          prompt?.conversational !== true &&
          plan?.conversational !== true,
      },
      {
        code: 'ASSET_PLATFORM_SEPARATION',
        passed: assets.every(
          (item) =>
            !item.platform ||
            item.platform === request?.platform
        ),
      },
    ];

    if (isImageRender) {
      checks.push(
        {
          code: 'ASSET_NOT_EMPTY',
          passed:
            assets.length === 1 &&
            Number(asset?.bytes || render?.localAsset?.bytes) > 0,
        },
        {
          code: 'MIME_ALLOWED',
          passed:
            assets.length === 1 &&
            asset?.mimeType === 'image/png',
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
              JSON.stringify(
                prompt?.metadata?.confirmedMeasurements || []
              ) === JSON.stringify(confirmedMeasurements)
            ),
        },
      );
    }

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
