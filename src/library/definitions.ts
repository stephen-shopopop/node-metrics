import type { StoreBuilder } from './store-builder.js';

/**
 * Configuration options for sampling metrics.
 *
 * @property sampleIntervalInMs - The interval, in milliseconds, at which samples are taken. Default is 1000 ms.
 * @property resolution - The number of samples to keep in memory. Default is 10.
 */
export type Options = {
  sampleIntervalInMs: number;
  resolution: number;
};

/**
 * Represents the set of property names for various Node.js process metrics.
 *
 * - `event_loop_delay_milliseconds`: The delay experienced by the Node.js event loop.
 * - `event_loop_utilized`: The percentage of event loop utilization.
 * - `heap_used_bytes`: The amount of memory used by the V8 heap.
 * - `heap_total_bytes`: The total size of the V8 heap.
 * - `rss_bytes`: The resident set size, or total memory allocated for the process.
 */
type MetricProperties =
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
