import it, { beforeEach, describe, type TestContext } from 'node:test';
import { EventLoopUtilizationPlugin } from '../src/library/plugins/event-loop-utilization.js';
import type { MetricsContext, MetricsValues } from '../src/library/definitions.js';
import { StoreBuilder } from '../src/library/store-builder.js';

describe('EventLoopUtilizationPlugin', () => {
  let plugin: EventLoopUtilizationPlugin;
  let ctx: MetricsContext;

  beforeEach(() => {
    // Arrange for all tests
    plugin = new EventLoopUtilizationPlugin();
    ctx = new StoreBuilder<MetricsValues>();
  });

  it('should have the correct name', (t: TestContext) => {
    t.plan(1);

    // Act && Assert
    t.assert.equal(plugin.name, 'EventLoopUtilizationPlugin');
  });

  it('should call ctx.set with eventLoopUtilized and the utilization value', (t: TestContext) => {
    t.plan(3);

    // Arrange
    const fakeElu = {
      active: 1,
      idle: 1,
      utilization: 0.42
    };

    const performanceEventLoopUtilizationMock = t.mock.method(
      performance,
      'eventLoopUtilization',
      () => fakeElu
    );

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.strictEqual(performanceEventLoopUtilizationMock.mock.callCount(), 1);
    t.assert.strictEqual(call.mock.callCount(), 1);
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, [
      'eventLoopUtilized',
      fakeElu.utilization
    ]);
  });

  it('should set eventLoopUtilized to 0 if elu is falsy', (t: TestContext) => {
    t.plan(2);

    // Arrange
    Reflect.set(plugin, 'elu', undefined);

    const call = t.mock.method(ctx, 'set');

    // Act
    plugin.capture(ctx);

    // Assert
    t.assert.strictEqual(call.mock.callCount(), 1);
    t.assert.deepStrictEqual(call.mock.calls.at(0)?.arguments, ['eventLoopUtilized', 0]);
  });
});
