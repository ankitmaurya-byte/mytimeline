import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import httpProxy from 'http-proxy';
import { logger } from './api-lib/logger';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '8000', 10);
const wsPort = parseInt(process.env.WS_PORT || '8001', 10);

// Create proxy for WebSocket connections to Go server
const proxy = httpProxy.createProxyServer({
  target: `http://localhost:${wsPort}`,
  ws: true,
});

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Proxy WebSocket upgrade requests to Go server
      if (req.url?.startsWith('/ws')) {
        // Let the upgrade handler deal with it
        return;
      }
      
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      logger.error({ err }, 'Error occurred handling request');
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Store server instance globally for API routes to access
  (global as any).__nextServer = server;

  // Proxy WebSocket connections to Go server
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/ws')) {
      logger.info('Proxying WebSocket connection to Go server');
      proxy.ws(req, socket, head);
    }
  });

  // Handle proxy errors
  proxy.on('error', (err, req, socket) => {
    logger.error({ err }, 'WebSocket proxy error');
    if (socket && !socket.destroyed) {
      socket.end();
    }
  });

  server
    .once('error', (err) => {
      logger.error({ err }, 'Server error');
      process.exit(1);
    })
    .listen(port, () => {
      logger.info(`Server ready on http://${hostname}:${port} with WebSocket support`);
    });
});
