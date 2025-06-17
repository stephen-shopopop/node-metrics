import type { Context, Next } from 'koa';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';

export const underPressureKoaMiddleware = ({
  sampleIntervalInMs,
  resolution,
  ...options
}: Readonly<MiddlewareOptions>): ((ctx: Context, next: Next) => Promise<void>) => {
  const metrics = Metrics.start({ sampleIntervalInMs, resolution });

  return async (ctx: Context, next: Next): Promise<void> => {
    const { event_loop_delay_milliseconds = 0, event_loop_utilized = 0 } = metrics.measures();

    if (
      event_loop_delay_milliseconds > options.maxEventLoopDelay ||
      event_loop_utilized > options.maxEventLoopUtilization
    ) {
      ctx.set('Retry-After', `${options.retryAfter ?? 10}`);
      ctx.throw(503);
    }

    await next();
  };
};
