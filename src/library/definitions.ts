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

type MetricProperties =
  | 'eventLoopDelay'
  | 'eventLoopUtilized'
  | 'heapUsed'
  | 'heapTotal'
  | 'rssBytes';

/**
 * Represents a mapping of metric property names to their corresponding numeric values.
 * Each key is a property from `MetricProperties`, and the value is a number representing the metric's value.
 *
 * @example
 * const metrics: MetricsValues = {
 *   requests: 120,
 *   errors: 5,
 *   latency: 200
 * };
 */
export type MetricsValues = {
  [key in MetricProperties]: number;
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
export type Context<T extends object = MetricsValues> = StoreBuilder<T>;
