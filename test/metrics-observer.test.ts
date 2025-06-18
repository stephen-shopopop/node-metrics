import { it, describe, type TestContext } from 'node:test';
import { MetricsObservable } from '../src/library/metrics-observer.js';

describe('MetricsObservable', () => {
  it('should attach an observer function', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const metrics = new MetricsObservable();
    const observer = t.mock.fn();

    // Act
    metrics.attach(observer);
    metrics.notify('test');

    // Assert
    t.assert.deepStrictEqual(observer.mock.calls.at(0)?.arguments, ['test', undefined]);
  });

  it('should not attach the same observer twice', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const metrics = new MetricsObservable();
    const observer = t.mock.fn();

    // Act
    metrics.attach(observer);
    metrics.attach(observer);
    metrics.notify('test');

    // Assert
    t.assert.strictEqual(observer.mock.callCount(), 1);
  });

  it('should detach an observer', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const metrics = new MetricsObservable();
    const observer = t.mock.fn();

    // Act
    metrics.attach(observer);
    metrics.detach(observer);
    metrics.notify('test');

    // Assert
    t.assert.strictEqual(observer.mock.callCount(), 0);
  });

  it('should notify observers with metadata', (t: TestContext) => {
    t.plan(1);

    // Arrange
    const metrics = new MetricsObservable();
    const observer = t.mock.fn();
    const metadata = { key: 'value' };

    // Act
    metrics.attach(observer);
    metrics.notify('test', metadata);

    // Assert
    t.assert.deepStrictEqual(observer.mock.calls.at(0)?.arguments, ['test', metadata]);
  });

  it('should notify multiple observers', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const metrics = new MetricsObservable();
    const observer1 = t.mock.fn();
    const observer2 = t.mock.fn();

    // Act
    metrics.attach(observer1);
    metrics.attach(observer2);
    metrics.notify('test');

    // Assert
    t.assert.deepStrictEqual(observer1.mock.calls.at(0)?.arguments, ['test', undefined]);
    t.assert.deepStrictEqual(observer2.mock.calls.at(0)?.arguments, ['test', undefined]);
  });
});
