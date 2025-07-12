import it, { beforeEach, describe, type TestContext } from 'node:test';
import { StoreBuilder } from '../src/library/store-builder.js';
import type { MetricsContext, MetricsValues } from '../src/index.js';
import { ActiveResourcesInfoPlugin } from '../src/library/plugins/active-resources-info.js';

describe('ActiveResourcesInfoPlugin', () => {
  let plugin: ActiveResourcesInfoPlugin;
  let ctx: MetricsContext;

  beforeEach(() => {
    // Arrange for all tests
    plugin = new ActiveResourcesInfoPlugin();
    ctx = new StoreBuilder<MetricsValues>();
  });

  it('should have the correct name', (t: TestContext) => {
    t.plan(1);

    // Act && Assert
    t.assert.equal(plugin.name, 'ActiveResourcesInfoPlugin');
  });

  it('should aggregate active handles and set them in context', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const handles = ['FSReqCallback', 'FSReqCallback', 'TCP', 'Pipe', 'Pipe'];
    const originalGetActiveResourcesInfo = process.getActiveResourcesInfo;
    process.getActiveResourcesInfo = () => handles;

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.strictEqual(call.mock.callCount(), 1);
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [
      'nodejs_active_resources',
      { FSReqCallback: 2, TCP: 1, Pipe: 2 }
    ]);

    process.getActiveResourcesInfo = originalGetActiveResourcesInfo;
  });

  it('should handle empty resources array', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const originalGetActiveResourcesInfo = process.getActiveResourcesInfo;
    process.getActiveResourcesInfo = () => [];

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, ['nodejs_active_resources', {}]);

    process.getActiveResourcesInfo = originalGetActiveResourcesInfo;
  });
});
