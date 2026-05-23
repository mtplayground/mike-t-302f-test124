import { createServer } from 'node:http';

import { createApp } from './app.js';

const defaultHost = '0.0.0.0';
const defaultPort = 8080;

function readPort(value: string | undefined): number {
  if (!value) {
    return defaultPort;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value "${value}". Expected an integer between 1 and 65535.`);
  }

  return port;
}

const host = process.env.HOST ?? defaultHost;
const port = readPort(process.env.PORT);
const app = createApp();
const server = createServer(app);

server.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error(error);
  }

  process.exit(1);
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received. Shutting down backend server.`);

  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
