import it, { beforeEach, describe, type TestContext } from 'node:test';
import { MemoryUsagePlugin } from '../src/library/plugins/memory-usage.js';
import type { Context, MetricsValues } from '../src/index.js';
import { StoreBuilder } from '../src/library/store-builder.js';

describe('MemoryUsagePlugin', () => {
  let plugin: MemoryUsagePlugin;
  let ctx: Context;

  beforeEach(() => {
    // Arrange for all tests
    plugin = new MemoryUsagePlugin();
    ctx = new StoreBuilder<MetricsValues>();
  });

  it('should have the correct name', (t: TestContext) => {
    t.plan(1);

    // Act && Assert
    t.assert.equal(plugin.name, 'MemoryUsagePlugin');
  });

  it('should capture and set memory usage metrics in the context', (t: TestContext) => {
    t.plan(5);

    // Arrange
    const fakeMemoryUsage = {
      heapUsed: 12345,
      heapTotal: 23456,
      rss: 34567
    };

    const memoryUsageMock = t.mock.method(process, 'memoryUsage', () => fakeMemoryUsage);

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.strictEqual(call.mock.callCount(), 3);
    t.assert.strictEqual(memoryUsageMock.mock.callCount(), 1);
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [
      'heapUsed',
      fakeMemoryUsage.heapUsed
    ]);
    t.assert.deepStrictEqual(call.mock.calls.at(1)?.arguments, [
      'heapTotal',
      fakeMemoryUsage.heapTotal
    ]);
    t.assert.deepStrictEqual(call.mock.calls.at(2)?.arguments, ['rssBytes', fakeMemoryUsage.rss]);
  });
});
