import type { MetricsBuilder } from './metrics-builder.js';

export type Options = {
  /** Default value is 1000 ms */
  sampleIntervalInMs: number;
  /** Default value is 10 */
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
  capture: PluginCapture<MetricsBuilder<T>>;
}

export type Context<T extends object = MetricsValues> = MetricsBuilder<T>;
