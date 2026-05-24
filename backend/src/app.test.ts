import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import type { AppConfig } from './config/env.js';

const testConfig = {
  nodeEnv: 'test',
  isProduction: false,
  host: '127.0.0.1',
  port: 0,
  sqlitePath: ':memory:',
  corsOrigin: true,
  frontendStaticDir: '/tmp/frontend-dist',
} satisfies AppConfig;

let frontendDistDir: string | undefined;

async function createFrontendDist() {
  frontendDistDir = await mkdtemp(join(tmpdir(), 'zeroclaw-frontend-'));
  await mkdir(join(frontendDistDir, 'assets'));
  await writeFile(join(frontendDistDir, 'index.html'), '<!doctype html><div id="root"></div>');
  await writeFile(join(frontendDistDir, 'assets', 'app.txt'), 'frontend asset');

  return frontendDistDir;
}

afterEach(async () => {
  if (frontendDistDir) {
    await rm(frontendDistDir, { force: true, recursive: true });
    frontendDistDir = undefined;
  }
});

describe('createApp', () => {
  it('responds to the health check route', async () => {
    const response = await request(createApp(testConfig)).get('/health').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
    });
  });

  it('serves built frontend assets and falls back to index.html for client routes', async () => {
    const frontendStaticDir = await createFrontendDist();
    const app = createApp({ ...testConfig, frontendStaticDir });

    await request(app).get('/assets/app.txt').expect(200, 'frontend asset');

    const response = await request(app).get('/tasks/123').expect(200);

    expect(response.text).toContain('<div id="root"></div>');
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('keeps API misses as JSON 404s instead of serving the frontend fallback', async () => {
    const frontendStaticDir = await createFrontendDist();
    const response = await request(createApp({ ...testConfig, frontendStaticDir }))
      .get('/api/missing')
      .expect(404);

    expect(response.body).toEqual({
      error: {
        message: 'Route GET /api/missing not found.',
      },
    });
  });
});
