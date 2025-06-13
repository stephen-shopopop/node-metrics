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

export type MetricsValues = {
  [key in MetricProperties]: number;
};

export type PluginCapture<T> = (value: T) => void;

export interface Plugin<T extends object = MetricsValues> {
  capture: PluginCapture<StoreBuilder<T>>;
}

export type Context<T extends object = MetricsValues> = StoreBuilder<T>;
