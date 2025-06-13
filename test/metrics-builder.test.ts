import test, { describe, type TestContext } from 'node:test';
import { MetricsBuilder } from '../src/library/metrics-builder.js';

describe('Metrics builder', () => {
  test('when instance of MetricsBuilder, then return object empty.', (t: TestContext) => {
    // Arrange
    const metrics = new MetricsBuilder();

    // Act and Assert
    t.assert.deepStrictEqual(metrics.toJson(), {});
    t.assert.ok(metrics instanceof MetricsBuilder);
  });

  test('when get eventLoopDelay, then return undefined.', (t: TestContext) => {
    // Arrange
    const metrics = new MetricsBuilder();

    // Act
    const eventLoopDelay = metrics.get('eventLoopDelay');

    // Assert
    t.assert.equal(eventLoopDelay, undefined);
  });

  test('when set eventLoopDelay, then return eventLoopDelay value.', (t: TestContext) => {
    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new MetricsBuilder();

    // Act
    const eventLoopDelay = metrics.set('eventLoopDelay', eventLoopDelayValue).get('eventLoopDelay');

    // Assert
    t.assert.strictEqual(eventLoopDelay, eventLoopDelayValue);
  });

  test('when use set, then return class MetricsBuilder.', (t: TestContext) => {
    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new MetricsBuilder();

    // Act
    metrics.set('eventLoopDelay', eventLoopDelayValue);

    // Assert
    t.assert.deepStrictEqual(metrics.toJson(), { eventLoopDelay: eventLoopDelayValue });
  });
});
