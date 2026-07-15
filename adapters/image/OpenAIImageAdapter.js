'use strict';

const { DesignEngineError } = require('../../errors/DesignEngineError');

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/images/generations';
const DEFAULT_EDIT_ENDPOINT = 'https://api.openai.com/v1/images/edits';
const DEFAULT_MODEL = 'gpt-image-2';
const DEFAULT_TIMEOUT_MS = 120000;

class OpenAIImageAdapter {
  constructor({
    apiKey = process.env.OPENAI_API_KEY,
    model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL,
    timeoutMs = Number(
      process.env.DESIGN_IMAGE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS
    ),
    endpoint = DEFAULT_ENDPOINT,
    editEndpoint = DEFAULT_EDIT_ENDPOINT,
    fetchImpl = globalThis.fetch,
  } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.endpoint = endpoint;
    this.editEndpoint = editEndpoint;
    this.fetchImpl = fetchImpl;
  }

  async generateImage({
    prompt,
    requestId,
    platform,
    size = '1024x1024',
    quality = 'medium',
    referenceImages = [],
  } = {}) {
    if (!this.apiKey) {
      throw new DesignEngineError(
        'OPENAI_IMAGE_NOT_CONFIGURED',
        'OPENAI_API_KEY no está configurada para generación de imágenes.'
      );
    }

    if (!this.fetchImpl) {
      throw new DesignEngineError(
        'OPENAI_IMAGE_TRANSPORT_UNAVAILABLE',
        'No existe transporte HTTP para OpenAI Images.'
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new DesignEngineError(
        'OPENAI_IMAGE_PROMPT_REQUIRED',
        'El prompt técnico es obligatorio.'
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const hasReferences = Array.isArray(referenceImages) &&
        referenceImages.length > 0;
      let body;
      let headers;

      if (hasReferences) {
        body = new FormData();
        body.set('model', this.model);
        body.set('prompt', prompt);
        body.set('n', '1');
        body.set('size', size);
        body.set('quality', quality);
        body.set('output_format', 'png');

        for (const image of referenceImages.slice(0, 4)) {
          body.append(
            'image[]',
            new Blob([image.buffer], { type: image.mimeType }),
            image.fileName || 'reference.png'
          );
        }
      } else {
        headers = { 'content-type': 'application/json' };
        body = JSON.stringify({
          model: this.model,
          prompt,
          n: 1,
          size,
          quality,
          output_format: 'png',
        });
      }

      const response = await this.fetchImpl(
        hasReferences ? this.editEndpoint : this.endpoint,
        {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          ...headers,
        },
        body,
        signal: controller.signal,
        }
      );

      let payload;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const providerCode = payload?.error?.code || null;
        const providerType = payload?.error?.type || null;
        const message = payload?.error?.message || 'OpenAI Images rechazó la solicitud.';

        if (
          response.status === 400 &&
          /moderation|safety|content/i.test(
            `${providerCode || ''} ${providerType || ''} ${message}`
          )
        ) {
          throw new DesignEngineError(
            'OPENAI_IMAGE_MODERATION_REJECTED',
            message,
            { requestId, platform, providerCode }
          );
        }

        throw new DesignEngineError(
          'OPENAI_IMAGE_PROVIDER_ERROR',
          message,
          {
            requestId,
            platform,
            status: response.status,
            providerCode,
          }
        );
      }

      const encoded = payload?.data?.[0]?.b64_json;
      if (!encoded || typeof encoded !== 'string') {
        throw new DesignEngineError(
          'OPENAI_IMAGE_INVALID_RESPONSE',
          'OpenAI Images no devolvió una imagen b64_json válida.',
          { requestId, platform }
        );
      }

      let buffer;
      try {
        buffer = Buffer.from(encoded, 'base64');
      } catch {
        buffer = null;
      }

      if (!buffer || buffer.length === 0) {
        throw new DesignEngineError(
          'OPENAI_IMAGE_INVALID_RESPONSE',
          'La imagen devuelta por OpenAI está vacía.',
          { requestId, platform }
        );
      }

      return {
        provider: 'openai',
        model: this.model,
        requestId,
        mimeType: 'image/png',
        bytes: buffer.length,
        buffer,
        usage: payload?.usage || null,
        mode: hasReferences ? 'edit' : 'generation',
      };
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new DesignEngineError(
          'OPENAI_IMAGE_TIMEOUT',
          'OpenAI Images excedió el tiempo máximo permitido.',
          { requestId, platform, timeoutMs: this.timeoutMs }
        );
      }

      if (error instanceof DesignEngineError) {
        throw error;
      }

      throw new DesignEngineError(
        'OPENAI_IMAGE_TRANSPORT_ERROR',
        'No fue posible comunicarse con OpenAI Images.',
        { requestId, platform }
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = {
  OpenAIImageAdapter,
  DEFAULT_ENDPOINT,
  DEFAULT_EDIT_ENDPOINT,
  DEFAULT_MODEL,
  DEFAULT_TIMEOUT_MS,
};
