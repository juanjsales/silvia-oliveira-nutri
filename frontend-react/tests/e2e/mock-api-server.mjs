import { createServer } from 'node:http';

const host = '127.0.0.1';
const port = Number(process.argv[2] ?? 3199);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid E2E mock API port: ${process.argv[2] ?? ''}`);
}

const server = createServer((request, response) => {
  response.setHeader('content-type', 'application/json; charset=utf-8');

  if (request.url === '/health') {
    response.writeHead(200);
    response.end(JSON.stringify({ status: 'ok', service: 'e2e-no-database-api' }));
    return;
  }

  response.writeHead(501);
  response.end(JSON.stringify({
    error: 'Unexpected API request in isolated E2E test.',
    method: request.method,
    path: request.url,
  }));
});

server.listen(port, host, () => {
  process.stdout.write(`Isolated E2E API listening at http://${host}:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
  server.closeAllConnections();
  setTimeout(() => process.exit(0), 1_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
