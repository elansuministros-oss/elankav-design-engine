'use strict';

const http = require('node:http');

const {
  createInternalDesignApi
} = require('./api/internalDesignApi');

const HOST = process.env.DESIGN_ENGINE_HOST || '127.0.0.1';
const PORT = Number(process.env.DESIGN_ENGINE_PORT || 4300);

const handleInternalDesignApi = createInternalDesignApi();

const server = http.createServer(async (req, res) => {
  try {
    const handled = await handleInternalDesignApi(req, res);

    if (handled) {
      return;
    }

    res.statusCode = 404;
    res.setHeader(
      'content-type',
      'application/json; charset=utf-8'
    );
    res.end(JSON.stringify({
      success: false,
      error: 'ROUTE_NOT_FOUND'
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader(
      'content-type',
      'application/json; charset=utf-8'
    );
    res.end(JSON.stringify({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message
    }));
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(
      `ELANKAV Design Engine listening on http://${HOST}:${PORT}`
    );
  });
}

module.exports = {
  HOST,
  PORT,
  server
};
