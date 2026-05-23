import { createServer } from 'node:http';

import { createApp } from './app.js';
import { loadConfig } from './config/env.js';

const config = loadConfig();
const app = createApp(config);
const server = createServer(app);

server.listen(config.port, config.host, () => {
  console.log(`Backend listening on http://${config.host}:${config.port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use.`);
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
