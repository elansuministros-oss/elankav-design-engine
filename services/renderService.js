'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DesignEngineError } = require('../errors/DesignEngineError');

const ASSET_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class RenderService {
  constructor({
    imageAdapter = null,
    promptBuilderService = null,
    outputDir = process.env.DESIGN_OUTPUT_DIR ||
      '/var/lib/elankav/design-engine/renders',
    publicBaseUrl = process.env.DESIGN_PUBLIC_BASE_URL ||
      'https://orchestrator.elankav.com/api/design-assets',
    fsImpl = fs,
    idFactory = randomUUID,
  } = {}) {
    this.imageAdapter = imageAdapter;
    this.promptBuilderService = promptBuilderService;
    this.outputDir = outputDir;
    this.publicBaseUrl = publicBaseUrl.replace(/\/$/, '');
    this.fsImpl = fsImpl;
    this.idFactory = idFactory;
  }

  async execute({ request, plan = null } = {}) {
    if (!request) {
      throw new DesignEngineError(
        'RENDER_INPUT_REQUIRED',
        'Render Service requiere una solicitud validada.'
      );
    }

    if (!this.promptBuilderService || !this.imageAdapter) {
      throw new DesignEngineError(
        'RENDER_DEPENDENCY_NOT_CONFIGURED',
        'Render Service requiere Prompt Builder y proveedor de imagen.'
      );
    }

    const prompt = this.promptBuilderService.build({ request, plan });

    if (prompt.type === 'NEEDS_INFORMATION') {
      return {
        status: 'NEEDS_INFORMATION',
        assets: [],
        providerConfigured: true,
        platform: request.platform,
        prompt,
      };
    }

    const generated = await this.imageAdapter.generateImage({
      prompt: prompt.content,
      requestId: request.requestId,
      platform: request.platform,
      size: request.image?.size || request.size || '1024x1024',
      quality: request.image?.quality || request.quality || 'medium',
    });

    if (
      generated.mimeType !== 'image/png' ||
      !Buffer.isBuffer(generated.buffer) ||
      generated.buffer.length === 0
    ) {
      throw new DesignEngineError(
        'INVALID_RENDER_OUTPUT',
        'El proveedor no devolvió un PNG válido.'
      );
    }

    const assetId = this.idFactory();
    if (!ASSET_ID_PATTERN.test(assetId)) {
      throw new DesignEngineError(
        'INVALID_ASSET_ID',
        'No fue posible crear un identificador seguro para el asset.'
      );
    }

    await this.fsImpl.mkdir(this.outputDir, {
      recursive: true,
      mode: 0o750,
    });

    const filename = `${assetId}.png`;
    const filePath = path.join(this.outputDir, filename);
    const resolvedOutputDir = path.resolve(this.outputDir);
    const resolvedFilePath = path.resolve(filePath);

    if (!resolvedFilePath.startsWith(`${resolvedOutputDir}${path.sep}`)) {
      throw new DesignEngineError(
        'ASSET_PATH_REJECTED',
        'La ruta calculada del asset no es válida.'
      );
    }

    await this.fsImpl.writeFile(filePath, generated.buffer, {
      flag: 'wx',
      mode: 0o640,
    });

    return {
      status: 'PROCESSED',
      providerConfigured: true,
      platform: request.platform,
      prompt,
      localAsset: {
        id: assetId,
        filePath,
        bytes: generated.buffer.length,
      },
      assets: [
        {
          id: assetId,
          type: 'IMAGE',
          mimeType: 'image/png',
          platform: request.platform,
          url: `${this.publicBaseUrl}/${assetId}`,
          width: null,
          height: null,
          bytes: generated.buffer.length,
          provider: generated.provider,
          model: generated.model,
        },
      ],
    };
  }
}

module.exports = {
  RenderService,
  ASSET_ID_PATTERN,
};
