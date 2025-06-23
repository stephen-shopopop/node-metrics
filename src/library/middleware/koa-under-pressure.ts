import type { Context, Next } from 'koa';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from '../constants.js';
import { isUnderPressure } from './under-pressure.js';

/**
 * Creates a Koa middleware that monitors system metrics and responds with a 503 Service Unavailable status
 * when the system is under pressure, as determined by the provided options and current metrics.
 *
 * @params appName - The name of the application, formatted as `${string}-${string}` (e.g., "service-order")
 * @param sampleIntervalInMs - Interval in milliseconds between metric samples. Defaults to `DEFAULT_SAMPLE_INTERVAL`.
 * @param resolution - The resolution for metric sampling. Defaults to `DEFAULT_RESOLUTION`.
 * @param webServerMetricsPort - Optional port for exposing web server metrics. Defaults to `0` (disabled).
 * @param retryAfter - Value (in seconds) for the `Retry-After` header in 503 responses. Defaults to `10`.
 * @param options - Additional middleware options for pressure detection.
 * @returns A Koa middleware function that checks system pressure and responds accordingly.
 *
 * @remarks
 * When the system is detected to be under pressure, the middleware:
 *   - Notifies observers with the current metrics.
 *   - Sets the `Retry-After` header.
 *   - Responds with HTTP 503 Service Unavailable.
 *   - Ends the response.
 * Otherwise, it passes control to the next middleware.
 *
 * ## Example
 *
 * ```ts
 * app.use(underPressureKoaMiddleware({
 *   sampleIntervalInMs: 1000,
 *   resolution: 10,
 *   webServerMetricsPort: 9090,
 *   maxEventLoopDelay: 1000,
 *   maxEventLoopUtilization: 0.9
 * }));
 * ```
 */
export const underPressureKoaMiddleware = ({
  appName,
  sampleIntervalInMs = DEFAULT_SAMPLE_INTERVAL,
  retryAfter = 10,
  webServerMetricsPort = 0,
  resolution = DEFAULT_RESOLUTION,
  ...options
}: Readonly<Partial<MiddlewareOptions>>): ((ctx: Context, next: Next) => Promise<void>) => {
  const metrics = Metrics.start({ appName, sampleIntervalInMs, resolution, webServerMetricsPort });

  return async (ctx: Context, next: Next): Promise<void> => {
    if (isUnderPressure({ ...options, ...metrics.measures() })) {
      metrics.observer.notify('System under pressure', metrics.measures());

      ctx.set('Retry-After', `${retryAfter}`);
      ctx.response.status = 503;
      ctx.response.message = 'Service Unavailable';
      ctx.res.end();
    }

    await next();
  };
};
