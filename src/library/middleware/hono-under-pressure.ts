import type { MiddlewareHandler } from 'hono';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from '../constants.js';
import { isUnderPressure } from './under-pressure.js';

/**
 * Creates a Hono middleware that monitors system metrics and returns a 503 Service Unavailable response
 * when the system is under pressure, as determined by the provided options and current metrics.
 *
 * @param options - Partial configuration for the middleware, including:
 *   - `appName`: The name of the application, formatted as `${string}-${string}` (e.g., "service-order")
 *   - `sampleIntervalInMs`: Interval in milliseconds for sampling system metrics (default: `DEFAULT_SAMPLE_INTERVAL`).
 *   - `resolution`: The resolution for metrics sampling (default: `DEFAULT_RESOLUTION`).
 *   - `webServerMetricsPort`: Port for exposing web server metrics (default: `0`).
 *   - `retryAfter`: Value for the `Retry-After` header in seconds when under pressure (default: `10`).
 *   - Additional options for pressure detection.
 * @returns A Hono `MiddlewareHandler` that checks system pressure and responds accordingly.
 *
 *  ## Example
 *
 * ```ts
 * app.use('*', underPressureHonoMiddleware({
 *   sampleIntervalInMs: 1000,
 *   resolution: 10,
 *   webServerMetricsPort: 9090,
 *   maxEventLoopDelay: 1000,
 *   maxEventLoopUtilization: 0.9
 * }));
 * ```
 */
export const underPressureHonoMiddleware = ({
  appName,
  sampleIntervalInMs = DEFAULT_SAMPLE_INTERVAL,
  resolution = DEFAULT_RESOLUTION,
  webServerMetricsPort = 0,
  retryAfter = 10,
  ...options
}: Readonly<Partial<MiddlewareOptions>>): MiddlewareHandler => {
  const metrics = Metrics.start({ appName, sampleIntervalInMs, resolution, webServerMetricsPort });

  return async (_c, next) => {
    if (isUnderPressure({ ...options, ...metrics.measures() })) {
      metrics.observer.notify('System under pressure', metrics.measures());

      return new Response('Service Unavailable', {
        headers: [['Retry-After', `${retryAfter}`]],
        status: 503
      });
    }

    return next();
  };
};
