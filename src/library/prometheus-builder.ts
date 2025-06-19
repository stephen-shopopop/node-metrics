/**
 * Reference:
 * https://github.com/prometheus/OpenMetrics/blob/d99b705f611b75fec8f450b05e344e02eea6921d/specification/OpenMetrics.md
 */

/**
 * Represents a standard Prometheus metric in text exposition format.
 *
 * @property help - The HELP line providing a description of the metric, following the format: `# HELP <metric_name> <description>`.
 * @property type - The TYPE line specifying the metric type, following the format: `# TYPE <metric_name> gauge`.
 * @property value - The metric value line, following the format: `<metric_name> <value>`.
 */
type StandardMetric = {
  help: `# HELP ${string} ${string}`;
  type: `# TYPE ${string} ${'gauge'}`;
  value: `${string} ${string}`;
};

/**
 * Represents a Prometheus Gauge metric.
 *
 * A Gauge is a metric that represents a single numerical value that can arbitrarily go up and down.
 * This class allows you to define a gauge with a name, value, optional label, and optional prefix.
 *
 * ## Example
 *
 * ```ts
 * const gauge = new Gauge('active_users', 42, 'Number of active users', 'app_');
 * const metric = gauge.register();
 * ```
 *
 * @public
 */
export class Gauge {
  constructor(
    readonly name: string,
    readonly value: number,
    readonly label = '',
    readonly prefix = ''
  ) {
    /** */
  }

  registry(): StandardMetric {
    return {
      help: `# HELP ${this.prefix}${this.name} ${this.label}`,
      type: `# TYPE ${this.prefix}${this.name} gauge`,
      value: `${this.prefix}${this.name} ${this.value}`
    };
  }
}

/**
 * A builder class for constructing and managing Prometheus metrics.
 *
 * The `PrometheusBuild` class allows you to create and register custom metrics,
 * such as gauges, with an optional prefix for metric names. It maintains an internal
 * registry of metrics and provides a method to output all registered metrics in the
 * OpenMetrics text format.
 *
 * @remarks
 * - The prefix, if provided, is prepended to all metric names.
 * - The `printRegistries` method returns a `Response` object with all metrics formatted for Prometheus scraping.
 *
 * @public
 */
export class PrometheusBuild {
  #registries: StandardMetric[] = [];

  constructor(readonly prefix?: `${string}_`) {
    /** */
  }

  /**
   * Sets a gauge metric with the specified name and value, optionally with a label.
   * The gauge is created with the provided parameters and registered with the current prefix.
   *
   * @param name - The name of the gauge metric.
   * @param value - The numeric value to set for the gauge.
   * @param label - (Optional) A label to associate with the gauge metric.
   */
  setGauge(name: string, value: number, label?: string) {
    const gauge = new Gauge(name, value, label, this.prefix);

    this.#registries.push(gauge.registry());

    return this;
  }

  /**
   * Returns a HTTP response containing the list of all registered Prometheus registries.
   *
   * The registries are joined into a single string, separated by newlines, and returned
   * with a content type of 'application/openmetrics-text'.
   *
   * @returns {Response} A response object with the joined registries as the body and a 200 status code.
   */
  printRegistries(): Response {
    const body = this.#registries
      .flatMap(({ help, type, value }: StandardMetric) => [help, type, value])
      .join('\n');

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/openmetrics-text' }
    });
  }
}
