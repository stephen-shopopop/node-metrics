import it, { beforeEach, describe, type TestContext } from 'node:test';
import { StoreBuilder } from '../src/library/store-builder.js';
import { ActiveHandlesPlugin, type MetricsContext, type MetricsValues } from '../src/index.js';

describe('ActiveHandlesPlugin', () => {
  let plugin: ActiveHandlesPlugin;
  let ctx: MetricsContext;

  beforeEach(() => {
    // Arrange for all tests
    plugin = new ActiveHandlesPlugin();
    ctx = new StoreBuilder<MetricsValues>();
  });

  it('should have the correct name', (t: TestContext) => {
    t.plan(1);

    // Act && Assert
    t.assert.equal(plugin.name, 'ActiveHandlesPlugin');
  });

  it('should aggregate active handles and set them in context', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const handles = [
      { constructor: { name: 'Timeout' } },
      { constructor: { name: 'Timeout' } },
      { constructor: { name: 'Socket' } }
    ];
    const originalGetActiveHandles = process._getActiveHandles;
    process._getActiveHandles = () => handles;

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.strictEqual(call.mock.callCount(), 1);
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [
      'metadata.nodejs_active_handles',
      { Socket: 1, Timeout: 2 }
    ]);

    process._getActiveHandles = originalGetActiveHandles;
  });

  it('should skip handles without a constructor', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const handles = [{ constructor: { name: 'Timeout' } }, null, undefined] as object[];
    const originalGetActiveHandles = process._getActiveHandles;
    process._getActiveHandles = () => handles;

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [
      'metadata.nodejs_active_handles',
      { Timeout: 1 }
    ]);

    process._getActiveHandles = originalGetActiveHandles;
  });
});
