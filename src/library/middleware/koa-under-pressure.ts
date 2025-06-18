import type { Context, Next } from 'koa';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from '../constants.js';
import { isUnderPressure } from './under-pressure.js';

/**
 * Creates a Koa middleware that monitors event loop performance and returns 503 errors when system is under pressure
 *
 * @param options - Configuration options for the middleware
 * @param options.sampleIntervalInMs - The interval in milliseconds at which to sample metrics
 * @param options.resolution - The resolution at which metrics are calculated
 * @param options.maxEventLoopDelay - Maximum allowed event loop delay in milliseconds before responding with 503
 * @param options.maxEventLoopUtilization - Maximum allowed event loop utilization (0-1) before responding with 503
 * @param options.retryAfter - Optional number of seconds to include in Retry-After header (defaults to 10)
 *
 * @returns A Koa middleware function that monitors system pressure
 * @throws {503} When system exceeds configured pressure thresholds
 *
 * @example
 * ```typescript
 * app.use(underPressureKoaMiddleware({
 *   sampleIntervalInMs: 1000,
 *   resolution: 10,
 *   maxEventLoopDelay: 100,
 *   maxEventLoopUtilization: 0.9,
 *   retryAfter: 5
 * }));
 * ```
 */
export const underPressureKoaMiddleware = ({
  sampleIntervalInMs = DEFAULT_SAMPLE_INTERVAL,
  retryAfter = 10,
  resolution = DEFAULT_RESOLUTION,
  ...options
}: Readonly<Partial<MiddlewareOptions>>): ((ctx: Context, next: Next) => Promise<void>) => {
  const metrics = Metrics.start({ sampleIntervalInMs, resolution });

  return async (ctx: Context, next: Next): Promise<void> => {
    if (isUnderPressure({ ...options, ...metrics.measures() })) {
      ctx.set('Retry-After', `${retryAfter}`);
      ctx.throw(503);
    }

    await next();
  };
};
