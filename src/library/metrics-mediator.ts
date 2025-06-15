import type { MetricsContext, Plugin } from './definitions.js';

interface Capture {
  plugins: Map<string, Plugin>;
  capture(context: MetricsContext): void;
}

/**
 * Mediates the collection of metrics by managing a set of plugins.
 *
 * The `MetricsMediator` class implements the `Capture` interface and allows
 * for the registration of multiple metric plugins. When the `capture` method
 * is called, it delegates the capture operation to all registered plugins.
 *
 * ## Example
 *
 * ```ts
 * const mediator = new MetricsMediator();
 * mediator.add(new SomePlugin());
 * mediator.capture(context);
 * ```
 *
 * @implements {Capture}
 */
export class MetricsMediator implements Capture {
  plugins = new Map<string, Plugin>();

  /**
   * Adds a new plugin to the list of registered plugins.
   *
   * @param plugin - The plugin instance to be added.
   */
  add(plugin: Plugin): void {
    if (!plugin.name) {
      throw new Error('Plugin must have name properties');
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    if (typeof plugin.capture === 'function') {
      this.plugins.set(plugin.name, plugin);
    }
  }

  /**
   * Invokes the `capture` method on all registered plugins, passing the provided context.
   *
   * @param context - The context object containing relevant data to be captured by each plugin.
   */
  capture(context: MetricsContext): void {
    [...this.plugins].flatMap(([, plugin]) => [plugin]).map((plugin) => plugin.capture(context));
  }
}
