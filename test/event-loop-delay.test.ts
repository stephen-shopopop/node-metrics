import it, { beforeEach, describe, type TestContext } from 'node:test';
import { EventLoopDelayPlugin } from '../src/library/plugins/event-loop-delay.js';
import { StoreBuilder } from '../src/library/store-builder.js';
import type { MetricsValues } from '../src/index.js';
import { DEFAULT_RESOLUTION } from '../src/library/constants.js';

describe('EventLoopDelayPlugin', () => {
  let plugin: EventLoopDelayPlugin;
  let ctx = new StoreBuilder<MetricsValues>();

  beforeEach(() => {
    // Arrange for all tests
    plugin = new EventLoopDelayPlugin();
    ctx = new StoreBuilder<MetricsValues>();
  });

  it('should have the correct name', (t: TestContext) => {
    t.plan(1);

    // Act && Assert
    t.assert.equal(plugin.name, 'EventLoopDelayPlugin');
  });

  it('should initialize with default resolution and enable histogram', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const fakeHistogramMean = 5e6; // 5ms in ns

    Reflect.set(plugin, 'histogram', {
      reset: t.mock.fn(),
      mean: fakeHistogramMean
    });

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.strictEqual(call.mock.callCount(), 1);
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [
      'event_loop_delay_milliseconds',
      Math.max(0, 5 - DEFAULT_RESOLUTION)
    ]);
  });

  it('should initialize with default resolution and enable histogram', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const fakeHistogramMean = 0.5e6; // 0.5 ms in ns

    Reflect.set(plugin, 'histogram', {
      reset: t.mock.fn(),
      mean: fakeHistogramMean
    });

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [
      'event_loop_delay_milliseconds',
      0
    ]);
  });

  it('should set eventLoopDelay to Infinity if computed value is NaN', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const fakeHistogramMean = Number.NaN;

    Reflect.set(plugin, 'histogram', {
      reset: t.mock.fn(),
      mean: fakeHistogramMean
    });

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.deepStrictEqual(call.mock.calls.at(1)?.arguments, [
      'event_loop_delay_milliseconds',
      Number.POSITIVE_INFINITY
    ]);
  });
});
