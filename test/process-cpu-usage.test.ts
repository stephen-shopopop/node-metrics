import { ProcessCpuUsagePlugin } from '../src/library/plugins/process-cpu-usage.js';
import type { MetricsContext, MetricsValues } from '../src/library/definitions.js';
import it, { beforeEach, describe, type TestContext } from 'node:test';
import { StoreBuilder } from '../src/library/store-builder.js';

describe('ProcessCpuUsagePlugin', () => {
  let plugin: ProcessCpuUsagePlugin;
  let ctx: MetricsContext;

  beforeEach(() => {
    plugin = new ProcessCpuUsagePlugin();
    ctx = new StoreBuilder<MetricsValues>();
  });

  it('should have correct name', (t: TestContext) => {
    t.plan(1);

    // Act && Assert
    t.assert.equal(plugin.name, 'ProcessCpuUsagePlugin');
  });

  it('should capture CPU metrics', (t: TestContext) => {
    t.plan(4);

    // Arrange
    const fakeCpuUsage = {
      user: 1000000, // 1 second in microseconds
      system: 2000000 // 2 seconds in microseconds
    };
    const processCpuUsageMock = t.mock.method(process, 'cpuUsage', () => fakeCpuUsage);

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.strictEqual(processCpuUsageMock.mock.callCount(), 1);
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [
      'process_cpu_user_seconds_total',
      1
    ]);
    t.assert.deepStrictEqual(call.mock.calls.at(1)?.arguments, [
      'process_cpu_system_seconds_total',
      2
    ]);
    t.assert.deepStrictEqual(call.mock.calls.at(2)?.arguments, ['process_cpu_seconds_total', 3]);
  });
});
