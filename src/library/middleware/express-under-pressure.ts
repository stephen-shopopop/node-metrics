import type express from 'express';
import type { MiddlewareOptions } from '../definitions.js';
import { Metrics } from '../metrics.js';

export const underPressureExpressMiddleware = ({
  sampleIntervalInMs,
  resolution,
  ...options
}: Readonly<MiddlewareOptions>): ((
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void) => {
  const metrics = Metrics.start({ sampleIntervalInMs, resolution });

  return (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { event_loop_delay_milliseconds = 0, event_loop_utilized = 0 } = metrics.measures();

    if (
      event_loop_delay_milliseconds > options.maxEventLoopDelay ||
      event_loop_utilized > options.maxEventLoopUtilization
    ) {
      res.setHeader('Retry-After', `${options.retryAfter ?? 10}`);
      res.status(503).end();
    }

    next();
  };
};
