import test, { describe, type TestContext } from 'node:test';
import { StoreBuilder } from '../src/library/store-builder.js';

describe('Store builder', () => {
  test('when instance of StoreBuilder, then return object empty.', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const metrics = new StoreBuilder();

    // Act and Assert
    t.assert.deepStrictEqual(metrics.toJson(), {});
    t.assert.ok(metrics instanceof StoreBuilder);
  });

  test('when get key not in store, then return undefined.', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const metrics = new StoreBuilder();

    // Act
    const eventLoopDelay = metrics.get('eventLoopDelay');

    // Assert
    t.assert.equal(eventLoopDelay, undefined);
  });

  test('when set new key in store, then return new key value.', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new StoreBuilder();

    // Act
    const eventLoopDelay = metrics.set('eventLoopDelay', eventLoopDelayValue).get('eventLoopDelay');

    // Assert
    t.assert.strictEqual(eventLoopDelay, eventLoopDelayValue);
  });

  test('when use toJson(), then return values in json object.', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new StoreBuilder();

    // Act
    metrics.set('eventLoopDelay', eventLoopDelayValue);

    // Assert
    t.assert.deepStrictEqual(metrics.toJson(), { eventLoopDelay: eventLoopDelayValue });
  });

  test('when use set, then return class StoreBuilder for chaining.', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const eventLoopDelayValue = 12;
    const metrics = new StoreBuilder();

    // Act
    const metricsInstance = metrics.set('eventLoopDelay', eventLoopDelayValue);

    // Assert
    t.assert.deepStrictEqual(metricsInstance, metrics);
    t.assert.ok(metricsInstance instanceof StoreBuilder);
  });

  test('when set multiple keys, then toJson returns all key-value pairs.', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const metrics = new StoreBuilder();
    metrics.set('heapUsed', 100).set('rss', 200);

    // Act
    const json = metrics.toJson();

    // Assert
    t.assert.deepStrictEqual(json, { heapUsed: 100, rss: 200 });
  });

  test('when set key twice, then get returns last value.', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const metrics = new StoreBuilder();
    metrics.set('heapUsed', 100);
    metrics.set('heapUsed', 300);

    // Act
    const value = metrics.get('heapUsed');

    // Assert
    t.assert.strictEqual(value, 300);
  });

  test('when toJson is called, returned object is frozen.', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const metrics = new StoreBuilder();
    metrics.set('heapUsed', 123);

    // Act
    const json = metrics.toJson();

    // Assert
    t.assert.throws(() => {
      // @ts-expect-error
      json.heapUsed = 456;
    });
  });

  test('when using generic type, then type safety is enforced.', (t: TestContext) => {
    t.plan(2);

    // Arrange
    type Metrics = { foo: number; bar: string };
    const metrics = new StoreBuilder<Metrics>();

    // Act
    metrics.set('foo', 42);
    metrics.set('bar', 'baz');

    // Assert
    t.assert.strictEqual(metrics.get('foo'), 42);
    t.assert.strictEqual(metrics.get('bar'), 'baz');
  });
});
