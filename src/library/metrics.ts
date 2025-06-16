import type { MetricsValues, Options, Plugin } from './definitions.js';
import { StoreBuilder } from './store-builder.js';
import { MemoryUsagePlugin } from './plugins/memory-usage.js';
import { EventLoopUtilizationPlugin } from './plugins/event-loop-utilization.js';
import { MetricsMediator } from './metrics-mediator.js';
import { EventLoopDelayPlugin } from './plugins/event-loop-delay.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from './constants.js';

/**
 * Singleton class for collecting and managing application metrics.
 *
 * The `Metrics` class provides a centralized mechanism to register metric plugins,
 * periodically sample metrics, and expose collected data. It is designed to be instantiated
 * only once via the static `start` method, enforcing a singleton pattern.
 *
 * ### Usage
 * - Use `Metrics.start(options)` to initialize and retrieve the singleton instance.
 * - Register custom metric plugins using the `register` method.
 * - Call `measures()` to retrieve the current metrics as JSON.
 * - Use `destroy()` to clean up resources and stop metric collection.
 *
 * ## Example
 *
 * ```typescript
 * const metrics = Metrics.start({ resolution: 1000 });
 * metrics.register(new CustomPlugin());
 * const data = metrics.measures();
 * ```
 *
 * @remarks
 * By default, the class registers memory usage, event loop delay, and event loop utilization plugins.
 * The sampling interval and resolution can be customized via the `options` parameter.
 *
 * @public
 */
export class Metrics<T extends object = MetricsValues> {
  static #instance: Metrics;
  readonly #resolution: number;
  readonly #sampleInterval: number;
  #timer: NodeJS.Timeout | undefined;
  #metricsMediator = new MetricsMediator();
  #metrics = new StoreBuilder<T>();

  // Prevent new with private constructor
  private constructor(private readonly options: Partial<Options>) {
    this.#resolution = this.options.resolution || DEFAULT_RESOLUTION;
    this.#sampleInterval = Math.max(
      this.#resolution,
      this.options.sampleIntervalInMs || DEFAULT_SAMPLE_INTERVAL
    );

    // Default register
    this.register(new MemoryUsagePlugin());
    this.register(new EventLoopDelayPlugin(this.#resolution));
    this.register(new EventLoopUtilizationPlugin());

    this.#timer = setTimeout(this.#begin, this.#sampleInterval);
    this.#timer.unref();
  }

  /**
   * Initializes and returns a singleton instance of the `Metrics` class.
   * If an instance does not already exist, it creates one using the provided options.
   * Subsequent calls will return the existing instance.
   *
   * @param options - Partial configuration options for initializing the `Metrics` instance.
   * @returns The singleton instance of `Metrics<MetricsValues>`.
   */
  static start(options: Readonly<Partial<Options>>): Metrics<MetricsValues> {
    if (!Metrics.#instance) {
      Metrics.#instance = new Metrics<MetricsValues>(options);

      // Declare NodeJs version on metrics
      Metrics.#instance.#metrics.set('metadata.nodejs_version_info', process.versions.node);
    }

    return Metrics.#instance;
  }

  /**
   * Registers a new plugin with the metrics mediator.
   *
   * @param plugin - The plugin instance to be registered.
   * @returns The current instance for method chaining.
   */
  register(plugin: Plugin) {
    this.#metricsMediator.add(plugin);

    return this;
  }

  #begin(): void {
    Metrics.#instance.#metricsMediator.capture(Metrics.#instance.#metrics);

    Metrics.#instance.#timer?.refresh();
  }

  /**
   * Cleans up resources used by the Metrics instance.
   *
   * Specifically, this method clears the internal timer to prevent any further scheduled metric collection or processing.
   * Should be called when the Metrics instance is no longer needed to avoid memory leaks or unintended behavior.
   */
  destroy(): void {
    clearTimeout(Metrics.#instance.#timer);
  }

  /**
   * Returns a partial object containing the current metric values.
   *
   * @returns {Partial<MetricsValues>} An object with the current metrics, possibly missing some properties.
   */
  values(): Partial<MetricsValues> {
    return Metrics.#instance.#metrics.toJson();
  }
}
