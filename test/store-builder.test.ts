import test, { describe, type TestContext } from 'node:test';
import { StoreBuilder } from '../src/library/store-builder.js';

describe('Store builder', () => {
  test('when instance of StoreBuilder, then return object empty.', (t: TestContext) => {
    // Arrange
    const metrics = new StoreBuilder();

    // Act and Assert
    t.assert.deepStrictEqual(metrics.toJson(), {});
    t.assert.ok(metrics instanceof StoreBuilder);
  });

  test('when get key not in store, then return undefined.', (t: TestContext) => {
    // Arrange
    const metrics = new StoreBuilder();

    // Act
    const eventLoopDelay = metrics.get('eventLoopDelay');

    // Assert
    t.assert.equal(eventLoopDelay, undefined);
  });

  test('when set new key in store, then return new key value.', (t: TestContext) => {
    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new StoreBuilder();

    // Act
    const eventLoopDelay = metrics.set('eventLoopDelay', eventLoopDelayValue).get('eventLoopDelay');

    // Assert
    t.assert.strictEqual(eventLoopDelay, eventLoopDelayValue);
  });

  test('when use toJson(), then return values in json object.', (t: TestContext) => {
    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new StoreBuilder();

    // Act
    metrics.set('eventLoopDelay', eventLoopDelayValue);

    // Assert
    t.assert.deepStrictEqual(metrics.toJson(), { eventLoopDelay: eventLoopDelayValue });
  });

  test('when use set, then return class StoreBuilder for chaining.', (t: TestContext) => {
    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new StoreBuilder();

    // Act
    const metricsInstance = metrics.set('eventLoopDelay', eventLoopDelayValue);

    // Assert
    t.assert.deepStrictEqual(metricsInstance, metrics);
    t.assert.ok(metricsInstance instanceof StoreBuilder);
  });
});
