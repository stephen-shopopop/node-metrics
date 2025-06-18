import type { MiddlewareHandler } from 'hono';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from '../constants.js';
import { isUnderPressure } from './under-pressure.js';

/**
 * Creates a middleware handler for monitoring server load using event loop metrics.
 * This middleware helps prevent server overload by monitoring event loop delay and utilization.
 *
 * @param options - Configuration options for the middleware
 * @param options.sampleIntervalInMs - The interval in milliseconds between event loop samples
 * @param options.resolution - The number of samples to keep in memory
 * @param options.maxEventLoopDelay - Maximum allowed event loop delay in milliseconds before returning 503
 * @param options.maxEventLoopUtilization - Maximum allowed event loop utilization (0-1) before returning 503
 * @param options.retryAfter - Optional. Number of seconds to suggest client wait before retrying (defaults to 10)
 * @returns A middleware handler function that returns 503 Service Unavailable if server is under high load
 *
 * @example
 * ```ts
 * app.use(underPressureHonoMiddleware({
 *   sampleIntervalInMs: 1000,
 *   resolution: 10,
 *   maxEventLoopDelay: 1000,
 *   maxEventLoopUtilization: 0.9
 * }));
 * ```
 */
export const underPressureHonoMiddleware = ({
  sampleIntervalInMs = DEFAULT_SAMPLE_INTERVAL,
  resolution = DEFAULT_RESOLUTION,
  retryAfter = 10,
  ...options
}: Readonly<Partial<MiddlewareOptions>>): MiddlewareHandler => {
  const metrics = Metrics.start({ sampleIntervalInMs, resolution });

  return async (_c, next) => {
    if (isUnderPressure({ ...options, ...metrics.measures() })) {
      return new Response('Service Unavailable', {
        headers: [['Retry-After', `${retryAfter}`]],
        status: 503
      });
    }

    return next();
  };
};
