import it, { beforeEach, describe, type TestContext } from 'node:test';
import { DebugPlugin, logger } from '../src/library/plugins/debug.js';
import type { MetricsValues } from '../src/library/definitions.js';
import { StoreBuilder } from '../src/library/store-builder.js';

describe('DebugPlugin', () => {
  let plugin: DebugPlugin;
  let ctx = new StoreBuilder<MetricsValues>();

  beforeEach(() => {
    // Arrange for all tests
    plugin = new DebugPlugin();
    ctx = new StoreBuilder<MetricsValues>();
  });

  it('should have correct name', (t: TestContext) => {
    t.plan(1);

    // Act && Assert
    t.assert.equal(plugin.name, 'DebugPlugin');
  });

  it('should call debug with context JSON', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const call = t.mock.method(logger, 'debug');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.strictEqual(call.mock.callCount(), 1);
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [{}]);
  });
});
