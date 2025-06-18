import { Hono } from 'hono';
import { Metrics, underPressureHonoMiddleware, type MiddlewareOptions } from '../src/index.js';
import it, { afterEach, describe, type TestContext } from 'node:test';
import { DEFAULT_SAMPLE_INTERVAL } from '../src/library/constants.js';

function setupHonoServer(options: Readonly<Partial<MiddlewareOptions>>) {
  const app = new Hono();

  app.use('*', underPressureHonoMiddleware(options));

  app.get('/', (c) => {
    return c.json({}, 200);
  });

  return app;
}

describe('underPressureHonoMiddleware', () => {
  afterEach(() => {
    // Clean state singleton
    const metrics = Metrics.start({});
    metrics.destroy();
  });

  it('should call next() when not under pressure', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    const app = setupHonoServer({});

    // Act
    const response = await app.request('/');

    // Assert
    t.assert.strictEqual(response.status, 200);
    t.assert.strictEqual(response.headers.get('content-type'), 'application/json');
    t.assert.deepStrictEqual(await response.json(), {});
  });

  it('should return 503 when server is under pressure (event loop delay)', async (t: TestContext) => {
    t.plan(4);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxEventLoopDelay very low to trigger under pressure
    const app = setupHonoServer({ maxEventLoopDelay: 1 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.request('/');

    // Assert
    t.assert.strictEqual(response.status, 503);
    t.assert.strictEqual(await response.text(), 'Service Unavailable');
    t.assert.strictEqual(response.headers.get('retry-after'), '10');
    t.assert.strictEqual(response.headers.get('content-type'), 'text/plain;charset=UTF-8');
  });

  it('should return 503 when server is under pressure (event loop utilization)', async (t: TestContext) => {
    t.plan(2);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxEventLoopUtilization very low to trigger under pressure
    const app = setupHonoServer({ maxEventLoopUtilization: 0.01 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.request('/');

    // Assert
    t.assert.strictEqual(response.status, 503);
    t.assert.strictEqual(response.headers.get('retry-after'), '10');
  });

  it('should use custom retryAfter value when provided', async (t: TestContext) => {
    t.plan(1);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxEventLoopDelay very low and custom retryAfter
    const app = setupHonoServer({ maxEventLoopDelay: 1, retryAfter: 42 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.request('/');

    // Assert
    t.assert.strictEqual(response.headers.get('retry-after'), '42');
  });
});
