import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';
import { DEFAULT_RESOLUTION, DEFAULT_SAMPLE_INTERVAL } from '../constants.js';
import { isUnderPressure } from './under-pressure.js';

/**
 * Creates a Fastify plugin that monitors system metrics and responds with a 503 Service Unavailable status
 * when the system is under pressure, as determined by the provided options and current metrics.
 *
 * @param appName - The name of the application, formatted as `${string}-${string}` (e.g., "service-order")
 * @param sampleIntervalInMs - Interval in milliseconds between metric samples. Defaults to `DEFAULT_SAMPLE_INTERVAL`.
 * @param resolution - The resolution for metric sampling. Defaults to `DEFAULT_RESOLUTION`.
 * @param webServerMetricsPort - Optional port for exposing web server metrics. Defaults to `0` (disabled).
 * @param retryAfter - Value (in seconds) for the `Retry-After` header in 503 responses. Defaults to `10`.
 * @param options - Additional middleware options for pressure detection.
 * @returns A Fastify plugin that checks system pressure and responds accordingly.
 *
 * @remarks
 * When the system is detected to be under pressure, the plugin:
 *   - Notifies observers with the current metrics.
 *   - Sets the `Retry-After` header.
 *   - Responds with HTTP 503 Service Unavailable.
 * Otherwise, it continues processing the request.
 *
 * ## Example
 *
 * ```ts
 * import Fastify from 'fastify';
 * import { underPressureFastifyPlugin } from '@stephen-shopopop/node-metrics';
 *
 * const fastify = Fastify();
 *
 * fastify.register(underPressureFastifyPlugin({
 *   sampleIntervalInMs: 1000,
 *   resolution: 10,
 *   webServerMetricsPort: 9090,
 *   maxEventLoopDelay: 1000,
 *   maxEventLoopUtilization: 0.9
 * }));
 * ```
 */
export const underPressureFastifyPlugin = ({
  appName,
  sampleIntervalInMs = DEFAULT_SAMPLE_INTERVAL,
  resolution = DEFAULT_RESOLUTION,
  webServerMetricsPort = 0,
  retryAfter = 10,
  ...options
}: Readonly<Partial<MiddlewareOptions>>): FastifyPluginCallback => {
  const metrics = Metrics.start({ appName, sampleIntervalInMs, resolution, webServerMetricsPort });

  const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.addHook('onRequest', async (_request: FastifyRequest, reply: FastifyReply) => {
      if (isUnderPressure({ ...options, ...metrics.measures() })) {
        metrics.observer.notify('System under pressure', metrics.measures());

        reply.header('Retry-After', `${retryAfter}`);
        reply.code(503).send();
        return;
      }
    });

    done();
  };
  
  // Make the plugin non-encapsulated (like fastify-plugin)
  (plugin as unknown as Record<symbol, boolean>)[Symbol.for('skip-override')] = true;
  
  return plugin;
};
