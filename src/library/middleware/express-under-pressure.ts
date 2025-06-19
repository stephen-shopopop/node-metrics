import type express from 'express';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from '../constants.js';
import { isUnderPressure } from './under-pressure.js';

/**
 * Express middleware to monitor system metrics and respond with HTTP 503 when the system is under pressure.
 *
 * This middleware periodically samples system metrics and, based on configurable thresholds,
 * determines if the server is under excessive load. If so, it sends a 503 Service Unavailable response
 * with a `Retry-After` header, otherwise it passes control to the next middleware.
 *
 * @param sampleIntervalInMs - Interval in milliseconds between metric samples. Defaults to `DEFAULT_SAMPLE_INTERVAL`.
 * @param resolution - The resolution for metric sampling. Defaults to `DEFAULT_RESOLUTION`.
 * @param webServerMetricsPort - Optional port for exposing web server metrics. Defaults to `0` (disabled).
 * @param retryAfter - Value (in seconds) for the `Retry-After` header in 503 responses. Defaults to `10`.
 * @param options - Additional middleware options for pressure detection.
 * @returns An Express middleware function that monitors system pressure and responds accordingly.
 *
 * ## example
 *
 * ```typescript
 * app.use(underPressureExpressMiddleware({
 *   sampleIntervalInMs: 1000,
 *   resolution: 10,
 *   webServerMetricsPort: 9090,
 *   maxEventLoopDelay: 100,
 *   maxEventLoopUtilization: 0.9,
 *   retryAfter: 30
 * }));
 * ```
 */
export const underPressureExpressMiddleware = ({
  sampleIntervalInMs = DEFAULT_SAMPLE_INTERVAL,
  resolution = DEFAULT_RESOLUTION,
  webServerMetricsPort = 0,
  retryAfter = 10,
  ...options
}: Readonly<Partial<MiddlewareOptions>>): ((
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void) => {
  const metrics = Metrics.start({ sampleIntervalInMs, resolution, webServerMetricsPort });

  return (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isUnderPressure({ ...options, ...metrics.measures() })) {
      metrics.observer.notify('System under pressure', metrics.measures());

      res.setHeader('Retry-After', `${retryAfter}`);
      res.status(503).end();
      return;
    }

    next();
  };
};
