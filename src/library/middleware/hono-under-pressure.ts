import type { MiddlewareHandler } from 'hono';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from '../constants.js';
import { isUnderPressure } from './under-pressure.js';

/**
 * Creates a Hono middleware that monitors system metrics and returns a 503 Service Unavailable response
 * when the system is under pressure, as determined by the provided options and current metrics.
 *
 * @params appName - The name of the application, formatted as `${string}-${string}` (e.g., "service-order")
 * @param sampleIntervalInMs - Interval in milliseconds between metric samples. Defaults to `DEFAULT_SAMPLE_INTERVAL`.
 * @param resolution - The resolution for metric sampling. Defaults to `DEFAULT_RESOLUTION`.
 * @param webServerMetricsPort - Optional port for exposing web server metrics. Defaults to `0` (disabled).
 * @param retryAfter - Value (in seconds) for the `Retry-After` header in 503 responses. Defaults to `10`.
 * @param options - Additional middleware options for pressure detection.
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
