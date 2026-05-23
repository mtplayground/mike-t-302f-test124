import { config as loadDotEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

loadDotEnv({ quiet: true });

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

type NodeEnvironment = 'development' | 'production' | 'test';

export type AppConfig = {
  nodeEnv: NodeEnvironment;
  isProduction: boolean;
  host: string;
  port: number;
  sqlitePath: string | undefined;
  corsOrigin: boolean | string | string[];
  frontendStaticDir: string;
};

function readNodeEnv(value: string | undefined): NodeEnvironment {
  if (!value) {
    return 'development';
  }

  if (value === 'development' || value === 'production' || value === 'test') {
    return value;
  }

  throw new Error(`Invalid NODE_ENV value "${value}". Expected development, production, or test.`);
}

function readPort(value: string | undefined): number {
  if (!value) {
    return 8080;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value "${value}". Expected an integer between 1 and 65535.`);
  }

  return port;
}

function readHost(value: string | undefined): string {
  if (!value) {
    return '0.0.0.0';
  }

  const host = value.trim();

  if (!host) {
    throw new Error('HOST cannot be empty.');
  }

  return host;
}

function readOptionalPath(value: string | undefined, name: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const path = value.trim();

  if (!path) {
    throw new Error(`${name} cannot be empty.`);
  }

  return resolve(backendRoot, path);
}

function readPath(value: string | undefined, name: string, fallback: string): string {
  const path = value?.trim() || fallback;

  if (!path) {
    throw new Error(`${name} cannot be empty.`);
  }

  return resolve(backendRoot, path);
}

function readCorsOrigin(
  value: string | undefined,
  nodeEnv: NodeEnvironment,
): boolean | string | string[] {
  if (!value) {
    return nodeEnv === 'production' ? false : true;
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error('CORS_ORIGIN cannot be empty.');
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  if (normalized.includes(',')) {
    return normalized
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return normalized;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = readNodeEnv(env.NODE_ENV);

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    host: readHost(env.HOST),
    port: readPort(env.PORT),
    sqlitePath: readOptionalPath(env.SQLITE_PATH, 'SQLITE_PATH'),
    corsOrigin: readCorsOrigin(env.CORS_ORIGIN, nodeEnv),
    frontendStaticDir: readPath(env.FRONTEND_STATIC_DIR, 'FRONTEND_STATIC_DIR', '../frontend/dist'),
  };
}
