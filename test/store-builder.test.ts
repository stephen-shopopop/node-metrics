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

  test('when get eventLoopDelay, then return undefined.', (t: TestContext) => {
    // Arrange
    const metrics = new StoreBuilder();

    // Act
    const eventLoopDelay = metrics.get('eventLoopDelay');

    // Assert
    t.assert.equal(eventLoopDelay, undefined);
  });

  test('when set eventLoopDelay, then return eventLoopDelay value.', (t: TestContext) => {
    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new StoreBuilder();

    // Act
    const eventLoopDelay = metrics.set('eventLoopDelay', eventLoopDelayValue).get('eventLoopDelay');

    // Assert
    t.assert.strictEqual(eventLoopDelay, eventLoopDelayValue);
  });

  test('when use set, then return class StoreBuilder.', (t: TestContext) => {
    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new StoreBuilder();

    // Act
    metrics.set('eventLoopDelay', eventLoopDelayValue);

    // Assert
    t.assert.deepStrictEqual(metrics.toJson(), { eventLoopDelay: eventLoopDelayValue });
  });
});
