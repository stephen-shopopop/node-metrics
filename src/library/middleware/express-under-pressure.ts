import type express from 'express';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from '../constants.js';
import { isUnderPressure } from './under-pressure.js';

/**
 * Creates an Express middleware that monitors event loop metrics and returns 503 status
 * when the server is under pressure.
 *
 * @param options - Configuration options for the middleware
 * @param options.sampleIntervalInMs - The interval in milliseconds between event loop samples
 * @param options.resolution - The number of samples to keep in memory
 * @param options.maxEventLoopDelay - Maximum allowed event loop delay in milliseconds before returning 503
 * @param options.maxEventLoopUtilization - Maximum allowed event loop utilization (0-1) before returning 503
 * @param options.retryAfter - Optional number of seconds to include in Retry-After header (defaults to 10)
 *
 * @returns Express middleware function that monitors server health
 *
 * ## example
 *
 * ```typescript
 * app.use(underPressureExpressMiddleware({
 *   sampleIntervalInMs: 1000,
 *   resolution: 10,
 *   maxEventLoopDelay: 100,
 *   maxEventLoopUtilization: 0.9,
 *   retryAfter: 30
 * }));
 * ```
 */
export const underPressureExpressMiddleware = ({
  sampleIntervalInMs = DEFAULT_SAMPLE_INTERVAL,
  resolution = DEFAULT_RESOLUTION,
  retryAfter = 10,
  ...options
}: Readonly<Partial<MiddlewareOptions>>): ((
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void) => {
  const metrics = Metrics.start({ sampleIntervalInMs, resolution });

  return (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isUnderPressure({ ...options, ...metrics.measures() })) {
      metrics.observer.notify('System under pressure', metrics.measures());

      res.setHeader('Retry-After', `${retryAfter}`);
      res.status(503).end();
    }

    next();
  };
};
