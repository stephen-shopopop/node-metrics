import type { MiddlewareHandler } from 'hono';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';

export const underPressureHonoMiddleware = ({
  sampleIntervalInMs,
  resolution,
  ...options
}: Readonly<MiddlewareOptions>): MiddlewareHandler => {
  const metrics = Metrics.start({ sampleIntervalInMs, resolution });

  return async (_c, next) => {
    const { event_loop_delay_milliseconds = 0, event_loop_utilized = 0 } = metrics.measures();

    if (
      event_loop_delay_milliseconds > options.maxEventLoopDelay ||
      event_loop_utilized > options.maxEventLoopUtilization
    ) {
      return new Response('Service Unavailable', {
        headers: [['Retry-After', `${options.retryAfter ?? 10}`]],
        status: 503
      });
    }

    return next();
  };
};
