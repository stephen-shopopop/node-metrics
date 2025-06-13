/**
 * The default resolution value used for metrics calculations.
 *
 * Represents the standard interval (in seconds) at which metrics are aggregated or sampled.
 * Adjust this value to change the granularity of metric data collection.
 */
export const DEFAULT_RESOLUTION = 10;

/**
 * The default interval, in milliseconds, at which samples are collected.
 *
 * @remarks
 * This constant is typically used to specify the frequency of metric sampling operations.
 *
 * @defaultValue 1000 (1 second)
 */
export const DEFAULT_SAMPLE_INTERVAL = 1e3;
