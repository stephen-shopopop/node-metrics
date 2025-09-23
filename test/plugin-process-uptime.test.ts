import it, { beforeEach, describe, type TestContext } from 'node:test';
import { ProcessUpTimePlugin } from '../src/library/plugins/process-uptime.js';
import type { MetricsContext, MetricsValues } from '../src';
import { StoreBuilder } from '../src/library/store-builder.js';

describe('ProcessUpTimePlugin', () => {
  let plugin: ProcessUpTimePlugin;
  let ctx: MetricsContext;

  beforeEach(() => {
    // Arrange for all tests
    plugin = new ProcessUpTimePlugin();
    ctx = new StoreBuilder<MetricsValues>();
  });

  it('should have correct name', (t: TestContext) => {
    t.plan(1);

    // Act && Assert
    t.assert.equal(plugin.name, 'ProcessUpTimePlugin');
  });

  it('should capture process start time', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const fakeNow = 1700000000000; // Some timestamp
    const fakeUptime = 3600; // 1 hour uptime

    t.mock.method(Date, 'now', () => fakeNow);
    const processUptimeMock = t.mock.method(process, 'uptime', () => fakeUptime);

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    t.assert.strictEqual(processUptimeMock.mock.callCount(), 1);
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [
      'process_start_time_seconds',
      1699996400
    ]);
  });
});
