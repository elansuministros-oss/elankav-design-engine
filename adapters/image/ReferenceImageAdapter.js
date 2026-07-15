'use strict';

const { DesignEngineError } = require('../../errors/DesignEngineError');

const DEFAULT_ALLOWED_HOSTS = ['elankav-core.vercel.app'];
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 20000;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeMimeType(value) {
  return String(value || '').split(';')[0].trim().toLowerCase();
}

function environmentAllowedHosts() {
  const configured = String(
    process.env.DESIGN_REFERENCE_ALLOWED_HOSTS || ''
  )
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  return configured.length ? configured : DEFAULT_ALLOWED_HOSTS;
}

class ReferenceImageAdapter {
  constructor({
    fetchImpl = globalThis.fetch,
    allowedHosts = environmentAllowedHosts(),
    maxBytes = positiveNumber(
      process.env.DESIGN_REFERENCE_MAX_BYTES,
      DEFAULT_MAX_BYTES
    ),
    timeoutMs = positiveNumber(
      process.env.DESIGN_REFERENCE_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS
    ),
  } = {}) {
    this.fetchImpl = fetchImpl;
    this.allowedHosts = new Set(
      allowedHosts.map(value => String(value).trim().toLowerCase())
    );
    this.maxBytes = maxBytes;
    this.timeoutMs = timeoutMs;
  }

  resolveUrl(reference) {
    const value = typeof reference === 'string'
      ? reference
      : reference?.url;
    let url;

    try {
      url = new URL(value);
    } catch {
      throw new DesignEngineError(
        'REFERENCE_IMAGE_URL_INVALID',
        'La referencia visual no contiene una URL válida.'
      );
    }

    if (
      url.protocol !== 'https:' ||
      !this.allowedHosts.has(url.hostname.toLowerCase()) ||
      url.pathname !== '/api/whatsapp-media'
    ) {
      throw new DesignEngineError(
        'REFERENCE_IMAGE_URL_REJECTED',
        'La referencia visual no pertenece a una fuente autorizada.'
      );
    }

    return url;
  }

  async download(reference) {
    if (typeof this.fetchImpl !== 'function') {
      throw new DesignEngineError(
        'REFERENCE_IMAGE_TRANSPORT_UNAVAILABLE',
        'No existe transporte HTTP para descargar la referencia visual.'
      );
    }

    const url = this.resolveUrl(reference);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'image/jpeg, image/png, image/webp' },
        redirect: 'error',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new DesignEngineError(
          'REFERENCE_IMAGE_HTTP_ERROR',
          'No fue posible descargar la referencia visual.',
          { status: response.status }
        );
      }

      const contentLength = Number(response.headers.get('content-length'));
      if (Number.isFinite(contentLength) && contentLength > this.maxBytes) {
        throw new DesignEngineError(
          'REFERENCE_IMAGE_SIZE_EXCEEDED',
          'La referencia visual excede el tamaño permitido.'
        );
      }

      const mimeType = normalizeMimeType(response.headers.get('content-type'));
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new DesignEngineError(
          'REFERENCE_IMAGE_MIME_REJECTED',
          'El formato de la referencia visual no está permitido.'
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > this.maxBytes) {
        throw new DesignEngineError(
          buffer.length
            ? 'REFERENCE_IMAGE_SIZE_EXCEEDED'
            : 'REFERENCE_IMAGE_EMPTY',
          buffer.length
            ? 'La referencia visual excede el tamaño permitido.'
            : 'La referencia visual está vacía.'
        );
      }

      return Object.freeze({
        buffer,
        mimeType,
        fileName: reference?.fileName || `reference.${mimeType.split('/')[1]}`,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new DesignEngineError(
          'REFERENCE_IMAGE_TIMEOUT',
          'La descarga de la referencia visual excedió el tiempo permitido.'
        );
      }

      if (error instanceof DesignEngineError) {
        throw error;
      }

      throw new DesignEngineError(
        'REFERENCE_IMAGE_DOWNLOAD_FAILED',
        'No fue posible descargar la referencia visual.'
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async downloadMany(references = []) {
    if (!Array.isArray(references)) {
      return [];
    }

    const selected = references
      .filter(reference => reference && (reference.url || typeof reference === 'string'))
      .slice(0, 4);

    return Promise.all(selected.map(reference => this.download(reference)));
  }
}

module.exports = {
  ReferenceImageAdapter,
  ALLOWED_MIME_TYPES,
  DEFAULT_ALLOWED_HOSTS,
  DEFAULT_MAX_BYTES,
  DEFAULT_TIMEOUT_MS,
};
