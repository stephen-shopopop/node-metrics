import { Metrics, underPressureFastifyPlugin, type MiddlewareOptions } from '../src';
import it, { afterEach, describe, type TestContext } from 'node:test';
import { DEFAULT_SAMPLE_INTERVAL } from '../src/library/constants.js';
import Fastify, { type FastifyInstance } from 'fastify';

async function setupFastifyApp(options: Readonly<Partial<MiddlewareOptions>>): Promise<FastifyInstance> {
  const app = Fastify();

  // Register plugin FIRST
  await app.register(underPressureFastifyPlugin(options));

  // Then define routes - they will be in the plugin scope
  await app.register(async (instance) => {
    instance.get('/', async (_request, _reply) => {
      return {};
    });
  });

  return app;
}

describe('underPressureFastifyPlugin', () => {
  afterEach(async () => {
    // Clean state singleton
    const metrics = Metrics.start({});
    metrics.destroy();
  });

  it('should call next() when not under pressure', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    const app = await setupFastifyApp({});

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    // Assert
    t.assert.strictEqual(response.statusCode, 200);
    t.assert.strictEqual(response.headers['content-type'], 'application/json; charset=utf-8');
    t.assert.deepStrictEqual(response.json(), {});

    await app.close();
  });

  it('should return 503 when server is under pressure (event loop delay)', async (t: TestContext) => {
    t.plan(2);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxEventLoopDelay very low to trigger under pressure
    const app = await setupFastifyApp({ maxEventLoopDelay: 1 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    // Assert
    t.assert.strictEqual(response.statusCode, 503);
    t.assert.strictEqual(response.headers['retry-after'], '10');

    await app.close();
  });

  it('should return 503 when server is under pressure (event loop utilization)', async (t: TestContext) => {
    t.plan(2);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxEventLoopUtilization very low to trigger under pressure
    const app = await setupFastifyApp({ maxEventLoopUtilization: 0.01 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    // Assert
    t.assert.strictEqual(response.statusCode, 503);
    t.assert.strictEqual(response.headers['retry-after'], '10');

    await app.close();
  });

  it('should return 503 when server is under pressure (heap usage)', async (t: TestContext) => {
    t.plan(2);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxHeapUsedBytes very low to trigger under pressure
    const app = await setupFastifyApp({ maxHeapUsedBytes: 1024 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    // Assert
    t.assert.strictEqual(response.statusCode, 503);
    t.assert.strictEqual(response.headers['retry-after'], '10');

    await app.close();
  });

  it('should return 503 when server is under pressure (RSS)', async (t: TestContext) => {
    t.plan(2);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxRssBytes very low to trigger under pressure
    const app = await setupFastifyApp({ maxRssBytes: 1024 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    // Assert
    t.assert.strictEqual(response.statusCode, 503);
    t.assert.strictEqual(response.headers['retry-after'], '10');

    await app.close();
  });

  it('should use custom retryAfter value when provided', async (t: TestContext) => {
    t.plan(2);

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Arrange: set maxEventLoopDelay very low and custom retryAfter
    const app = await setupFastifyApp({ maxEventLoopDelay: 1, retryAfter: 42 });

    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    // Assert
    t.assert.strictEqual(response.statusCode, 503);
    t.assert.strictEqual(response.headers['retry-after'], '42');

    await app.close();
  });
});
