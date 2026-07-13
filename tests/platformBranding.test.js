'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PlatformBrandingService,
} = require('../services/platformBrandingService');

const {
  VisualQaService,
} = require('../services/visualQaService');

function profiles() {
  return [
    {
      platform: 'ELANVISUAL',
      version: '1.0.0',
      logoLogicalPath: 'brands/elanvisual/logo.svg',
      watermarkLogicalPath: 'brands/elanvisual/watermark.svg',
      commercialData: {
        website: 'visual.elankav.com',
      },
      palette: [],
      typography: [],
    },
    {
      platform: 'ELANHOME',
      version: '1.0.0',
      logoLogicalPath: 'brands/elanhome/logo.svg',
      watermarkLogicalPath: 'brands/elanhome/watermark.svg',
      commercialData: {
        website: 'home.elankav.com',
      },
      palette: [],
      typography: [],
    },
  ];
}

test('mantiene separados los perfiles de cada plataforma', () => {
  const service = new PlatformBrandingService(profiles());

  const visual = service.resolve('ELANVISUAL');
  const home = service.resolve('ELANHOME');

  assert.equal(visual.platform, 'ELANVISUAL');
  assert.equal(home.platform, 'ELANHOME');
  assert.notEqual(
    visual.logoLogicalPath,
    home.logoLogicalPath
  );
});

test('rechaza plataforma sin branding registrado', () => {
  const service = new PlatformBrandingService(profiles());

  assert.throws(
    () => service.resolve('PLATAFORMA_INEXISTENTE'),
    (error) =>
      error.code === 'PLATFORM_BRAND_PROFILE_NOT_FOUND'
  );
});

test('QA rechaza assets pertenecientes a otra plataforma', () => {
  const qaService = new VisualQaService();

  const result = qaService.evaluate({
    request: {
      platform: 'ELANVISUAL',
      directClientConversation: false,
    },
    plan: {
      profile: { id: 'SIGNAGE-BASE' },
      branding: { platform: 'ELANVISUAL' },
      conversational: false,
    },
    render: {
      assets: [
        {
          id: 'ASSET-001',
          platform: 'ELANHOME',
        },
      ],
    },
  });

  assert.equal(result.approved, false);
  assert.equal(
    result.errors.includes('ASSET_PLATFORM_SEPARATION'),
    true
  );
});

test('QA aprueba resultado estructurado para ELAN IA', () => {
  const qaService = new VisualQaService();

  const result = qaService.evaluate({
    request: {
      platform: 'ELANVISUAL',
      directClientConversation: false,
    },
    plan: {
      profile: { id: 'SIGNAGE-BASE' },
      branding: { platform: 'ELANVISUAL' },
      conversational: false,
    },
    render: {
      assets: [
        {
          id: 'ASSET-001',
          platform: 'ELANVISUAL',
        },
      ],
    },
  });

  assert.equal(result.approved, true);
  assert.equal(result.errors.length, 0);
});
