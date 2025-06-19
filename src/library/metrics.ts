import type { MetricsValues, Options, Plugin } from './definitions.js';
import { StoreBuilder } from './store-builder.js';
import { MemoryUsagePlugin } from './plugins/memory-usage.js';
import { EventLoopUtilizationPlugin } from './plugins/event-loop-utilization.js';
import { MetricsMediator } from './metrics-mediator.js';
import { EventLoopDelayPlugin } from './plugins/event-loop-delay.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from './constants.js';
import { ProcessUpTimePlugin } from './plugins/process-uptime.js';
import { ProcessCpuUsagePlugin } from './plugins/process-cpu-usage.js';
import { MetricsObservable } from './metrics-observer.js';
import { MetricsServer } from './metrics-server.js';

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
 * By default, the class registers memory usage, event loop delay event loop utilization plugins, process uptime and process cpu usage.
 * The sampling interval and resolution can be customized via the `options` parameter.
 *
 * @public
 */
export class Metrics<T extends object = MetricsValues> {
  private static _instance: Metrics;
  readonly #resolution: number;
  readonly #sampleInterval: number;
  #timer: NodeJS.Timeout | undefined;
  #metricsMediator = new MetricsMediator();
  #metrics = new StoreBuilder<T>();
  observer = new MetricsObservable();
  #server: MetricsServer | undefined;

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
    this.register(new ProcessUpTimePlugin());
    this.register(new ProcessCpuUsagePlugin());

    this.#timer = setTimeout(this.#begin, this.#sampleInterval);
    this.#timer.unref();
  }

  /**
   * Initializes and starts the Metrics singleton instance with the provided options.
   *
   * - If the Metrics instance does not already exist, it creates a new one.
   * - Sets the Node.js version information as a metric.
   * - Optionally starts a metrics web server if `webServerMetricsPort` is specified in the options.
   *
   * @param options - Partial configuration options for initializing the Metrics instance.
   * @returns The singleton instance of `Metrics<MetricsValues>`.
   */
  static start(options: Readonly<Partial<Options>>): Metrics<MetricsValues> {
    if (!Metrics._instance) {
      Metrics._instance = new Metrics<MetricsValues>(options);

      // Declare NodeJs version on metrics
      Metrics._instance.#metrics.set('metadata.nodejs_version_info', process.versions.node);

      // Start metrics server
      if (options.webServerMetricsPort) {
        Metrics._instance.#server = new MetricsServer(
          Metrics._instance.#metrics,
          Metrics._instance.observer
        );

        Metrics._instance.#server?.start(options.webServerMetricsPort);
      }

      // Wait and see
      // for (const signal of ['SIGTERM', 'SIGINT'] as const) {
      //   process.once(signal, () => {
      //     Metrics.start({}).closeWebServerMetrics();
      //     // ✅ Don't process exit, please!
      //   });
      // }
    }

    return Metrics._instance;
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
    Metrics._instance.#metricsMediator.capture(Metrics._instance.#metrics);

    Metrics._instance.#timer?.refresh();
  }

  /**
   * Cleans up resources used by the Metrics instance.
   *
   * Specifically, this method clears the internal timer to prevent any further scheduled metric collection or processing.
   * Should be called when the Metrics instance is no longer needed to avoid memory leaks or unintended behavior.
   */
  destroy(): void {
    clearTimeout(Metrics._instance.#timer);

    // Use this for testing only
    if (process.env['NODE_ENV'] !== 'production') {
      Reflect.set(Metrics, '_instance', undefined);
    }
  }

  /**
   * Closes the web server used for exposing metrics, if it exists.
   *
   * This method asynchronously destroys the internal HTTP server instance
   * that serves metrics endpoints. It is safe to call even if the server
   * was never started.
   *
   * @returns {Promise<void>} A promise that resolves when the server has been closed.
   */
  async closeWebServerMetrics(): Promise<void> {
    await Metrics._instance.#server?.destroy();
  }

  /**
   * Returns a partial object containing the current metric values.
   *
   * @returns {Partial<MetricsValues>} An object with the current metrics, possibly missing some properties.
   */
  measures(): Partial<MetricsValues> {
    return Metrics._instance.#metrics.toJson();
  }
}
