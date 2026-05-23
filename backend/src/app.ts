import cors from 'cors';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';

import { loadConfig, type AppConfig } from './config/env.js';

const jsonBodyLimit = '1mb';

type HttpError = Error & {
  status?: number;
  statusCode?: number;
};

function isHttpError(error: unknown): error is HttpError {
  return error instanceof Error;
}

function getHttpStatus(error: unknown): number {
  if (!isHttpError(error)) {
    return 500;
  }

  const status = error.status ?? error.statusCode;

  if (typeof status !== 'number' || status < 400 || status > 599) {
    return 500;
  }

  return status;
}

const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found.`,
    },
  });
};

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;

  const status = getHttpStatus(error);
  const message = status >= 500 ? 'Internal server error.' : error.message;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error: {
      message,
    },
  });
};

export function createApp(config: AppConfig = loadConfig()) {
  const app = express();

  app.disable('x-powered-by');

  if (config.corsOrigin !== false) {
    app.use(
      cors({
        origin: config.corsOrigin,
      }),
    );
  }

  app.use(express.json({ limit: jsonBodyLimit }));

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
