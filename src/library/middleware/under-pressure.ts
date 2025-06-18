import type { MetricsValues, UnderPressureOptions } from '../definitions.js';

/**
 * Determines if the system is under pressure based on various metrics
 *
 * @param {Object} options - The options and metrics values to check
 * @param {number} [options.maxEventLoopDelay=0] - Maximum allowed event loop delay in milliseconds
 * @param {number} [options.maxEventLoopUtilization=0] - Maximum allowed event loop utilization (0-1)
 * @param {number} [options.maxHeapUsedBytes=0] - Maximum allowed heap usage in bytes
 * @param {number} [options.maxRssBytes=0] - Maximum allowed RSS memory usage in bytes
 * @param {number} [options.event_loop_delay_milliseconds=0] - Current event loop delay in milliseconds
 * @param {number} [options.event_loop_utilized=0] - Current event loop utilization (0-1)
 * @param {number} [options.heap_used_bytes=0] - Current heap usage in bytes
 * @param {number} [options.rss_bytes=0] - Current RSS memory usage in bytes
 * @returns {boolean} True if system is under pressure, false otherwise
 */
export const isUnderPressure = ({
  maxEventLoopDelay = 0,
  maxEventLoopUtilization = 0,
  maxHeapUsedBytes = 0,
  maxRssBytes = 0,
  event_loop_delay_milliseconds = 0,
  event_loop_utilized = 0,
  heap_used_bytes = 0,
  rss_bytes = 0
}: Readonly<Partial<UnderPressureOptions & MetricsValues>>): boolean => {
  const check = (value: number) => value > 0;

  if (check(maxEventLoopDelay) && event_loop_delay_milliseconds > maxEventLoopDelay) {
    return true;
  }

  if (check(maxHeapUsedBytes) && heap_used_bytes > maxHeapUsedBytes) {
    return true;
  }

  if (check(maxRssBytes) && rss_bytes > maxRssBytes) {
    return true;
  }

  return check(maxEventLoopUtilization) && event_loop_utilized > maxEventLoopUtilization;
};
