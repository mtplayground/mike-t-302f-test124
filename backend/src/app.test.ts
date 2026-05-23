import request from 'supertest';
import { describe, expect, it } from 'vitest';

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

describe('createApp', () => {
  it('responds to the health check route', async () => {
    const response = await request(createApp(testConfig)).get('/health').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
    });
  });
});
