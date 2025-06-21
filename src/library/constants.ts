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

/**
 * The maximum allowed event loop delay in milliseconds.
 *
 * This constant is used to define the upper threshold for acceptable event loop lag.
 * If the event loop delay exceeds this value (1000 ms), it may indicate performance issues
 * or blocking operations in the Node.js process.
 */
export const MAX_EVENT_LOOP_DELAY = 1e3;

/**
 * The maximum allowed event loop utilization before triggering warnings or throttling.
 *
 * This constant is used to monitor the Node.js event loop and ensure that the application
 * does not exceed a safe utilization threshold, which could lead to performance degradation.
 *
 * @remarks
 * A value close to 1.0 means the event loop is almost fully utilized, leaving little room for
 * additional asynchronous operations. Setting this threshold helps maintain application responsiveness.
 *
 * @see {@link https://nodejs.org/api/perf_hooks.html#eventlooputilization}
 */
export const MAX_EVENT_LOOP_UTILIZATION = 0.98;

/**
 * The topic name used for broadcasting metrics over a channel.
 *
 * This constant is used to identify the broadcast channel for metrics communication
 * between different parts of the application or between different browser contexts.
 */
export const CHANNEL_TOPIC_METRICS = 'channel:metrics';
