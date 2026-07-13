'use strict';

const {
  createDefaultDesignEngine
} = require('../engine/createDefaultDesignEngine');

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
  designEngine = createDefaultDesignEngine()
} = {}) {
  return async function handleInternalDesignApi(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, {
        status: 'OK',
        service: 'ELANKAV Design Engine',
        version: '0.1.0',
        externalProvidersEnabled: false
      });

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
          result
        });
      } catch (error) {
        const statusCode =
          error.code === 'INVALID_JSON'
            ? 400
            : 422;

        sendJson(res, statusCode, {
          success: false,
          error: error.code || 'DESIGN_ENGINE_ERROR',
          message: error.message
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
  sendJson
};
