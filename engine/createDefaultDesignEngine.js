'use strict';

const { DesignEngine } = require('./DesignEngine');
const {
  DesignRequestService,
} = require('../services/designRequestService');
const {
  PromptBuilderService,
} = require('../services/promptBuilderService');
const {
  RenderService,
} = require('../services/renderService');
const {
  VisualQaService,
} = require('../services/visualQaService');
const {
  OpenAIImageAdapter,
} = require('../adapters/image/OpenAIImageAdapter');
const {
  ReferenceImageAdapter,
} = require('../adapters/image/ReferenceImageAdapter');

function createDefaultDesignEngine(options = {}) {
  const designRequestService =
    options.designRequestService || new DesignRequestService();
  const promptBuilderService =
    options.promptBuilderService || new PromptBuilderService();
  const imageAdapter =
    options.imageAdapter || new OpenAIImageAdapter(options.openAI || {});
  const referenceImageAdapter =
    options.referenceImageAdapter ||
    new ReferenceImageAdapter(options.references || {});
  const renderService =
    options.renderService || new RenderService({
      imageAdapter,
      promptBuilderService,
      referenceImageAdapter,
      outputDir: options.outputDir,
      publicBaseUrl: options.publicBaseUrl,
    });
  const visualQaService =
    options.visualQaService || new VisualQaService();

  const engine = new DesignEngine({
    designRequestService,
    renderService,
    visualQaService,
  });

  const executeCore = engine.execute.bind(engine);

  engine.execute = async function execute(input) {
    const result = await executeCore(input);
    const approved = result.qa?.approved === true;
    const hasSingleAsset = result.assets?.length === 1;
    const processed = approved && hasSingleAsset;

    return {
      ...result,
      designId: processed ? result.assets[0].id : null,
      status: processed ? 'PROCESSED' : 'NEEDS_INFORMATION',
      elanIaResult: {
        ...result.elanIaResult,
        conversational: false,
        clientReady: processed,
      },
    };
  };

  return engine;
}

module.exports = {
  createDefaultDesignEngine,
};
