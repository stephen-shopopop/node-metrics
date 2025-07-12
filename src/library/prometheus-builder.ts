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
  type: `# TYPE ${string} ${'gauge' | 'counter'}`;
  value: string;
};

/**
 * Represents a Prometheus Gauge metric for monitoring purposes.
 *
 * A Gauge is a metric that represents a single numerical value that can arbitrarily go up and down.
 * This class helps construct a Prometheus-compatible gauge metric with optional labeling and service identification.
 *
 * ## Example
 *
 * ```ts
 * const gauge = new Gauge('active_users', 42, 'Number of active users', 'user-service');
 * const metric = gauge.registry();
 * ```
 *
 * @param name - The name of the metric (without prefix).
 * @param value - The current value of the gauge.
 * @param label - (Optional) A description or label for the metric.
 * @param service - (Optional) The service name associated with the metric. Defaults to 'unknown'.
 * @param prefix - (Optional) The prefix for the metric name. Defaults to 'nodejs_'.
 */
export class Gauge {
  constructor(
    readonly name: string,
    readonly value: number | { [key: string]: number },
    readonly label = '',
    readonly service = 'unknown',
    readonly prefix = 'nodejs_'
  ) {
    /** */
  }

  registry(): StandardMetric {
    return {
      help: `# HELP ${this.prefix}${this.name} ${this.label}`,
      type: `# TYPE ${this.prefix}${this.name} gauge`,
      value:
        typeof this.value === 'number'
          ? `${this.prefix}${this.name}{service="${this.service}"} ${this.value}`
          : Object.entries(this.value)
              .map(
                ([type, value]) =>
                  `${this.prefix}${this.name}{service="${this.service}",type="${type}"} ${value}`
              )
              .join('\n')
    };
  }
}

/**
 * Represents a Prometheus counter metric.
 *
 * @remarks
 * This class is used to build and register counter metrics in Prometheus format.
 *
 * ## Example
 *
 * ```typescript
 * const counter = new Counter('requests_total', 5, 'Total number of requests', 'my-service');
 * const metric = counter.registry();
 * ```
 *
 * @param name - The name of the metric.
 * @param value - The value of the counter.
 * @param label - An optional description or label for the metric. Defaults to an empty string.
 * @param service - The name of the service reporting the metric. Defaults to 'unknown'.
 * @param prefix - The prefix for the metric name. Defaults to 'nodejs_'.
 */
export class Counter {
  constructor(
    readonly name: string,
    readonly value: number,
    readonly label = '',
    readonly service = 'unknown',
    readonly prefix = 'nodejs_'
  ) {
    /** */
  }

  registry(): StandardMetric {
    return {
      help: `# HELP ${this.prefix}${this.name} ${this.label}`,
      type: `# TYPE ${this.prefix}${this.name} counter`,
      value: `${this.prefix}${this.name}{service="${this.service}"} ${this.value}`
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
 * - The serviceName, if provided, is prepended to all metric labels.
 * - The `printRegistries` method returns a `Response` object with all metrics formatted for Prometheus scraping.
 *
 * @public
 */
export class PrometheusBuild {
  #registries: StandardMetric[] = [];

  constructor(readonly serviceName?: `${string}-${string}`) {
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
  setGauge(name: string, value: number | { [key: string]: number }, label?: string) {
    const gauge = new Gauge(name, value, label, this.serviceName);

    this.#registries.push(gauge.registry());

    return this;
  }

  /**
   * Sets a counter metric with the specified name and value, optionally with a label.
   * The counter is created with the provided parameters and registered with the current prefix.
   *
   * @param name - The name of the counter metric.
   * @param value - The numeric value to set for the counter.
   * @param label - (Optional) A label to associate with the counter metric.
   */
  setCounter(name: string, value: number, label?: string) {
    const counter = new Counter(name, value, label, this.serviceName);

    this.#registries.push(counter.registry());

    return this;
  }

  /**
   * Generates a plain text representation of all registered Prometheus metrics and returns it as an HTTP response.
   *
   * The response body is constructed by flattening each metric's `help`, `type`, and `value` fields,
   * joining them with newline characters. The response is returned with a `Content-Type` header
   * set to `text/plain; version=0.0.4; charset=utf-8`, which is compatible with Prometheus exposition format.
   *
   * @returns {Response} An HTTP response containing the formatted metrics data.
   */
  printRegistries(): Response {
    const body = this.#registries
      .flatMap(({ help, type, value }: StandardMetric) => [help, type, value])
      .join('\n');

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
        // 'Content-Type': 'application/openmetrics-text; version=1.0.0; charset=utf-8' - need "#EOF \n" after each metrics
      }
    });
  }
}
