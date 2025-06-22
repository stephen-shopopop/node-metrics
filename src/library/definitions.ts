import type { StoreBuilder } from './store-builder.js';

/**
 * Configuration options for node-metrics library.
 *
 * @property sampleIntervalInMs - The interval, in milliseconds, at which samples are collected.
 * @property resolution - The resolution or granularity of the collected metrics.
 * @property webServerMetricsPort - The port number on which the web server for metrics will listen. We recommend using port 9090.
 */
export type Options = {
  sampleIntervalInMs: number;
  resolution: number;
  webServerMetricsPort: number;
};

/**
 * Options for configuring system pressure monitoring
 *
 * @interface UnderPressureOptions
 * @property {number} maxEventLoopDelay - Maximum allowed event loop delay in milliseconds
 * @property {number} maxEventLoopUtilization - Maximum allowed event loop utilization (between 0 and 1)
 * @property {number} maxHeapUsedBytes - Maximum allowed heap memory usage in bytes
 * @property {number} maxRssBytes - Maximum allowed Resident Set Size (RSS) in bytes
 */
export type UnderPressureOptions = {
  maxEventLoopDelay: number;
  maxEventLoopUtilization: number;
  maxHeapUsedBytes: number;
  maxRssBytes: number;
};

/**
 * Configuration options for the middleware.
 *
 * @typedef {Object} MiddlewareOptions
 * @extends {Options}
 * @extends {UnderPressureOptions}
 * @property {number} retryAfter - The number of seconds to wait before retrying a request
 */
export type MiddlewareOptions = {
  retryAfter: number;
} & Options &
  UnderPressureOptions;

/**
 * Represents the set of supported metric property names for Node.js process and event loop monitoring.
 *
 * - `'event_loop_delay_milliseconds'`: The delay in the Node.js event loop, measured in milliseconds.
 * - `'event_loop_utilized'`: The proportion of time the event loop is actively processing events.
 * - `'heap_used_bytes'`: The number of bytes used by the V8 heap.
 * - `'heap_total_bytes'`: The total number of bytes allocated for the V8 heap.
 * - `'rss_bytes'`: The resident set size, or the amount of memory allocated for the process.
 * - `'process_start_time_seconds'`: The process start time, represented in seconds since the Unix epoch.
 * - `'process_cpu_user_seconds_total'`: The total user CPU time consumed by the process, in seconds.
 * - `'process_cpu_system_seconds_total'`: The total system CPU time consumed by the process, in seconds.
 * - `'process_cpu_seconds_total'`: The total CPU time (user + system) consumed by the process, in seconds.
 */
export type MetricProperties =
  | 'event_loop_delay_milliseconds'
  | 'event_loop_utilized'
  | 'heap_used_bytes'
  | 'heap_total_bytes'
  | 'rss_bytes'
  | 'process_start_time_seconds'
  | 'process_cpu_user_seconds_total'
  | 'process_cpu_system_seconds_total'
  | 'process_cpu_seconds_total';

/**
 * Represents a mapping of metric property names to their corresponding numeric values.
 * Each key is a property from `MetricProperties`, and the value is a number representing the metric's value.
 *
 * ## Example
 *
 * ```ts
 * const metrics: MetricsValues = {
 *   event_loop_delay_milliseconds: 120,
 *   'metric.delay': 5,
 *   'metadata.health_check': 'OK'
 * };
 * ```
 */
export type MetricsValues = {
  [key in MetricProperties]: number;
} & {
  [key: `metric.${string}`]: number;
  [key: `metadata.${string}`]: object | string;
};

/**
 * Represents a function that captures or processes a value of type `T`.
 *
 * @typeParam T - The type of value to be captured.
 * @param value - The value to be captured or processed.
 */
export type PluginCapture<T> = (value: T) => void;

/**
 * Represents a plugin that can capture metrics or data using a provided store builder.
 *
 * @typeParam T - The type of the metrics values object. Defaults to `MetricsValues`.
 * @property capture - A function or object responsible for capturing data, parameterized by a `StoreBuilder` of type `T`.
 */
export interface Plugin<T extends object = MetricsValues> {
  name: Readonly<string>;
  capture: PluginCapture<StoreBuilder<T>>;
}

/**
 * Represents a context object for metrics, parameterized by a type extending `MetricsValues`.
 *
 * @template T - The type of the metrics values, defaults to `MetricsValues`.
 * @see StoreBuilder
 */
export type MetricsContext<T extends object = MetricsValues> = StoreBuilder<T>;

/**
 * Represents an observer function type that handles logging or monitoring events.
 * @param message - The main message or payload to be observed. Can be either a string or an object.
 * @param metadata - Optional additional contextual information associated with the message.
 */
export type Observer = (message: string | object, metadata?: object) => void;

/**
 * Represents the context of an HTTP request.
 *
 * @property method - The HTTP method (e.g., 'GET', 'POST').
 * @property headers - A record of HTTP headers associated with the request.
 * @property path - The request path (URL endpoint).
 * @property query - An object containing query parameters from the URL.
 * @property body - A function that returns a promise resolving to the parsed request body.
 */
export type Context = {
  method: string;
  headers: Record<string, string>;
  path: string;
  query: Record<string, string>;
  body: () => Promise<unknown>;
};

/**
 * Represents a callback function to handle HTTP requests in a web server context.
 *
 * @param request - The context object representing the incoming HTTP request.
 * @returns A `Response` object or a `Promise` that resolves to a `Response`.
 */
export type FetchCallback = (request: Context) => Promise<Response> | Response;

/**
 * Configuration options for the web server.
 *
 * @property port - The port number on which the server will listen. Defaults to 0 if not specified.
 * @property fetchCallback - A callback function to handle fetch requests.
 */
export type WebServerOptions = {
  /** Use default value = 0 */
  port?: number;
  fetchCallback: FetchCallback;
};
