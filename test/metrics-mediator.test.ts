import test, { beforeEach, describe, mock, type TestContext } from 'node:test';
import { MetricsMediator } from '../src/library/metrics-mediator.js';
import type { MetricsValues, Plugin } from '../src/index.js';
import { StoreBuilder } from '../src/library/store-builder.js';

describe('MetricsMediator', () => {
  let mediator: MetricsMediator;
  let pluginA: Readonly<Plugin>;
  let pluginB: Readonly<Plugin>;
  let context: StoreBuilder<MetricsValues>;

  beforeEach(() => {
    // Arrange for all tests
    mediator = new MetricsMediator();
    context = new StoreBuilder<MetricsValues>();
    pluginA = {
      name: 'pluginA',
      capture: mock.fn()
    } as const;
    pluginB = {
      name: 'pluginB',
      capture: mock.fn()
    } as const;
  });

  describe('add', () => {
    test('adds a plugin successfully', (t: TestContext) => {
      t.plan(1);

      // Act
      mediator.add(pluginA);

      // Assert
      t.assert.ok(mediator.plugins.has('pluginA'));
    });

    test('throws if plugin has no name', (t: TestContext) => {
      t.plan(1);

      // Arrange
      const badPlugin = { capture: mock.fn() } as unknown as Plugin;

      // Act
      const addedPlugin = () => mediator.add(badPlugin);

      // Assert
      t.assert.throws(addedPlugin, { name: 'Error', message: 'Plugin must have name properties' });
    });

    test('throws if plugin with same name is added twice', (t: TestContext) => {
      t.plan(1);

      // Arrange
      mediator.add(pluginA);

      // Act
      const addedPlugin = () => mediator.add(pluginA);

      // Arrange
      t.assert.throws(addedPlugin, {
        name: 'Error',
        message: 'Plugin pluginA is already registered'
      });
    });

    test('does not add plugin if capture is not a function', (t: TestContext) => {
      t.plan(1);

      // Arrange
      const badPlugin = { name: 'bad', capture: null } as unknown as Plugin;

      // Act
      mediator.add(badPlugin);

      // Assert
      t.assert.ok(!mediator.plugins.has('bad'));
    });
  });

  describe('capture', () => {
    test('calls capture on all registered plugins', (t: TestContext) => {
      t.plan(2);

      // Arrange
      mediator.add(pluginA);
      mediator.add(pluginB);

      const callA = t.mock.method(pluginA, 'capture');
      const callB = t.mock.method(pluginB, 'capture');

      // Act
      mediator.capture(context);

      // Assert
      t.assert.strictEqual(callA.mock.callCount(), 1);
      t.assert.strictEqual(callB.mock.callCount(), 1);
    });

    test('does nothing if no plugins are registered', (t: TestContext) => {
      t.plan(1);

      // Act
      const captured = () => mediator.capture(context);

      // Assert
      t.assert.doesNotThrow(captured);
    });
  });
});
