import { Metrics, underPressureExpressMiddleware, type MiddlewareOptions } from '../src/index.js';
import it, { afterEach, describe, type TestContext } from 'node:test';
import { DEFAULT_SAMPLE_INTERVAL } from '../src/library/constants.js';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import axios, { type AxiosInstance } from 'axios';

let connection: Server | undefined;

function setupExpressServer(options: Readonly<Partial<MiddlewareOptions>>): AxiosInstance {
  const app = express();

  app.use(underPressureExpressMiddleware(options));

  app.get('/', (_req, res) => {
    res.status(200).json({});
  });

  connection = app.listen(0);

  const { port } = connection.address() as AddressInfo;

  return axios.create({
    baseURL: `http://127.0.0.1:${port}`,
    validateStatus: () => true
  });
}

async function stopWebServer(): Promise<void> {
  await new Promise<void>((resolve) => {
    if (connection !== undefined) {
      connection.close(() => {
        resolve();
      });
    }
  });
}

describe('underPressureExpressMiddleware', () => {
  afterEach(async () => {
    // Clean state
    await stopWebServer();

    // Clean state singleton
    const metrics = Metrics.start({});
    metrics.destroy();
  });

  it('should call next() when not under pressure', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    const app = setupExpressServer({});

    // Act
    const response = await app.get('/');

    // Assert
    t.assert.strictEqual(response.status, 200);
    t.assert.strictEqual(response.headers['content-type'], 'application/json; charset=utf-8');
    t.assert.deepStrictEqual(response.data, {});
  });

  it('should return 503 when server is under pressure (event loop delay)', async (t: TestContext) => {
    t.plan(2);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxEventLoopDelay very low to trigger under pressure
    const app = setupExpressServer({ maxEventLoopDelay: 1 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.get('/');

    // Assert
    t.assert.strictEqual(response.status, 503);
    t.assert.strictEqual(response.headers['retry-after'], '10');
  });

  it('should return 503 when server is under pressure (event loop utilization)', async (t: TestContext) => {
    t.plan(2);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxEventLoopUtilization very low to trigger under pressure
    const app = setupExpressServer({ maxEventLoopUtilization: 0.01 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.get('/');

    // Assert
    t.assert.strictEqual(response.status, 503);
    t.assert.strictEqual(response.headers['retry-after'], '10');
  });

  it('should use custom retryAfter value when provided', async (t: TestContext) => {
    t.plan(1);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxEventLoopDelay very low and custom retryAfter
    const app = setupExpressServer({ maxEventLoopDelay: 1, retryAfter: 42 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.get('/');

    // Assert
    t.assert.strictEqual(response.headers['retry-after'], '42');
  });
});
