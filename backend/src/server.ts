import { createServer } from 'node:http';

import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { openDatabase } from './db/database.js';
import { runMigrations } from './db/migrations.js';
import { createTasksRepo } from './tasks/tasksRepo.js';
import { createTasksService } from './tasks/tasksService.js';

function startServer() {
  const config = loadConfig();
  const database = openDatabase(config.sqlitePath);

  runMigrations(database);

  const tasksRepo = createTasksRepo(database);
  const tasksService = createTasksService(tasksRepo);
  const app = createApp(config, { tasksService });
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

    database.close();
    process.exit(1);
  });

  function shutdown(signal: NodeJS.Signals) {
    console.log(`${signal} received. Shutting down backend server.`);

    server.close((error) => {
      if (error) {
        console.error(error);
        database.close();
        process.exit(1);
      }

      database.close();
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

try {
  startServer();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
}
