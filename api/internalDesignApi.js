'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const {
  createDefaultDesignEngine,
} = require('../engine/createDefaultDesignEngine');
const { ASSET_ID_PATTERN } = require('../services/renderService');

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');

  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('JSON inválido');
    error.code = 'INVALID_JSON';
    throw error;
  }
}

function createInternalDesignApi({
  designEngine = createDefaultDesignEngine(),
  outputDir = process.env.DESIGN_OUTPUT_DIR ||
    '/var/lib/elankav/design-engine/renders',
  fsImpl = fs,
} = {}) {
  return async function handleInternalDesignApi(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, {
        status: 'OK',
        service: 'ELANKAV Design Engine',
        version: '0.1.0',
        externalProvidersEnabled: Boolean(process.env.OPENAI_API_KEY),
        realImageGenerationEnabled: true,
      });

      return true;
    }

    const assetMatch = url.pathname.match(
      /^\/internal\/assets\/([^/]+)$/
    );

    if (req.method === 'GET' && assetMatch) {
      const assetId = assetMatch[1];

      if (!ASSET_ID_PATTERN.test(assetId)) {
        sendJson(res, 404, {
          success: false,
          error: 'ASSET_NOT_FOUND',
        });
        return true;
      }

      const resolvedOutputDir = path.resolve(outputDir);
      const filePath = path.resolve(
        outputDir,
        `${assetId}.png`
      );

      if (!filePath.startsWith(`${resolvedOutputDir}${path.sep}`)) {
        sendJson(res, 404, {
          success: false,
          error: 'ASSET_NOT_FOUND',
        });
        return true;
      }

      try {
        const buffer = await fsImpl.readFile(filePath);
        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
          throw Object.assign(new Error('Asset vacío'), {
            code: 'ENOENT',
          });
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'image/png');
        res.setHeader('content-length', String(buffer.length));
        res.setHeader('cache-control', 'private, max-age=300');
        res.end(buffer);
      } catch (error) {
        if (error?.code === 'ENOENT') {
          sendJson(res, 404, {
            success: false,
            error: 'ASSET_NOT_FOUND',
          });
        } else {
          sendJson(res, 500, {
            success: false,
            error: 'ASSET_READ_ERROR',
          });
        }
      }

      return true;
    }

    if (
      req.method === 'POST' &&
      url.pathname === '/internal/design'
    ) {
      try {
        const input = await readJsonBody(req);
        const result = await designEngine.execute(input);

        sendJson(res, 200, {
          success: true,
          result,
        });
      } catch (error) {
        const statusCode =
          error.code === 'INVALID_JSON'
            ? 400
            : error.code === 'OPENAI_IMAGE_NOT_CONFIGURED'
              ? 503
              : 422;

        sendJson(res, statusCode, {
          success: false,
          error: error.code || 'DESIGN_ENGINE_ERROR',
          message: error.message,
        });
      }

      return true;
    }

    return false;
  };
}

module.exports = {
  createInternalDesignApi,
  readJsonBody,
  sendJson,
};
