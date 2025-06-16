import test, { afterEach, describe, type TestContext } from 'node:test';
import { Metrics } from '../src/library/metrics.js';
import type { Plugin } from '../src/index.js';
import { DEFAULT_SAMPLE_INTERVAL } from '../src/library/constants.js';

describe('Metrics', () => {
  afterEach(() => {
    // Clean state singleton
    const metrics = Metrics.start({});
    metrics.destroy();
  });

  test('should create singleton instance', (t: TestContext) => {
    t.plan(1);

    // Act
    const metrics1 = Metrics.start({});
    const metrics2 = Metrics.start({});

    // Assert
    t.assert.deepStrictEqual(metrics1, metrics2);
  });

  test('should initialize with custom options', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const options = { resolution: 10, sampleIntervalInMs: 3000 };

    // Act
    const metrics = Metrics.start(options);

    // Assert
    t.assert.ok(metrics instanceof Metrics);
  });

  test('should register custom plugin', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const mockPlugin: Plugin = {
      name: 'mock-plugin',
      capture: (ctx) => ctx.set('metric.custom_metric', 10)
    };

    t.mock.timers.enable({ apis: ['setTimeout'] });

    // Act
    const metrics = Metrics.start({ sampleIntervalInMs: DEFAULT_SAMPLE_INTERVAL });
    metrics.register(mockPlugin);

    // Assert
    t.assert.ok(!Reflect.has(metrics.measures(), 'metric.custom_metric'));
    // Advance in time
    t.mock.timers.tick(DEFAULT_SAMPLE_INTERVAL + 1);
    t.assert.ok(Reflect.has(metrics.measures(), 'metric.custom_metric'));
  });

  test('should include nodejs version in metrics', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const metrics = Metrics.start({});

    // Act
    const values = metrics.measures();

    // Assert
    t.assert.ok(Reflect.has(values, 'metadata.nodejs_version_info'));
    t.assert.strictEqual(
      Reflect.get(values, 'metadata.nodejs_version_info'),
      process.versions.node
    );
  });

  test('should cleanup resources on destroy', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const metrics = Metrics.start({});

    // Act
    metrics.destroy();

    // Assert
    t.assert.throws(() => metrics.measures(), { name: 'TypeError' });
  });
});
