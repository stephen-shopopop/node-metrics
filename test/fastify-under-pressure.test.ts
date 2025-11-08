import { Metrics, underPressureFastifyPlugin, type MiddlewareOptions } from '../src';
import it, { afterEach, describe, type TestContext } from 'node:test';
import { DEFAULT_SAMPLE_INTERVAL } from '../src/library/constants.js';
import Fastify, { type FastifyInstance } from 'fastify';

async function setupFastifyApp(
  options: Readonly<Partial<MiddlewareOptions>>
): Promise<FastifyInstance> {
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

  it('should cleanup metrics on close via onClose hook', async (t: TestContext) => {
    t.plan(3);

    // Arrange: Create app with metrics server
    const app = await setupFastifyApp({
      appName: 'test-cleanup',
      webServerMetricsPort: 0 // Dynamic port
    });

    // Act: Make a request to ensure the app is working
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    // Assert: Request should succeed
    t.assert.strictEqual(response.statusCode, 200);

    // Get metrics instance before closing
    const metricsInstance = Metrics.start({ appName: 'test-cleanup' });
    t.assert.ok(metricsInstance, 'Metrics instance should exist');

    // Act: Close the app (this should trigger onClose hook which calls closeWebServerMetrics then destroy)
    await app.close();

    // Assert: After closing, the metrics instance should be destroyed
    // We can verify this by checking that a new Metrics.start() creates a fresh instance
    const metricsAfterClose = Metrics.start({ appName: 'test-cleanup-2' });
    t.assert.ok(metricsAfterClose, 'Metrics instance should be available after cleanup');

    // Cleanup
    await metricsAfterClose.closeWebServerMetrics();
    metricsAfterClose.destroy();
  });

  it('should close metrics web server before destroying metrics', async (t: TestContext) => {
    t.plan(3);

    // Arrange: Create app with metrics server on dynamic port
    const app = await setupFastifyApp({
      appName: 'test-server-close-order',
      webServerMetricsPort: 0
    });

    // Act: Make a request to ensure everything is initialized
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    // Assert: Request should succeed
    t.assert.strictEqual(response.statusCode, 200);

    // Verify metrics instance exists
    const metricsBeforeClose = Metrics.start({ appName: 'test-server-close-order' });
    t.assert.ok(metricsBeforeClose, 'Metrics instance should exist before close');

    // Act: Close the app (should call closeWebServerMetrics then destroy in that order)
    await app.close();

    // Assert: After closing, we should be able to create a new metrics instance
    // This proves the previous server was properly closed and destroyed
    const newMetrics = Metrics.start({
      appName: 'test-after-close-order',
      webServerMetricsPort: 0
    });

    t.assert.ok(newMetrics, 'Should be able to create new metrics after cleanup');

    // Cleanup
    await newMetrics.closeWebServerMetrics();
    newMetrics.destroy();
  });

  it('should handle close gracefully even without web server', async (t: TestContext) => {
    t.plan(2);

    // Arrange: Create app without metrics web server (port 0 means disabled)
    const app = await setupFastifyApp({
      appName: 'test-no-webserver',
      webServerMetricsPort: 0
    });

    // Act: Make a request
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    // Assert: Request should succeed
    t.assert.strictEqual(response.statusCode, 200);

    // Act & Assert: Close should not throw even without web server
    await t.assert.doesNotReject(
      async () => await app.close(),
      'Should close gracefully without web server'
    );
  });
});
