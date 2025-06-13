import { monitorEventLoopDelay, type IntervalHistogram } from 'node:perf_hooks';
import type { Context, Plugin } from '../definitions.js';
import { DEFAULT_RESOLUTION } from '../constants.js';

/**
 * A plugin that monitors and records the event loop delay using a histogram.
 *
 * The `EventLoopDelayPlugin` utilizes Node.js's `monitorEventLoopDelay` to track the event loop's responsiveness.
 * On each capture, it records the mean event loop delay (in milliseconds, adjusted by the resolution) into the provided context.
 * If the delay cannot be determined, it sets the value to `Infinity`.
 *
 * @implements {Plugin}
 */
export class EventLoopDelayPlugin implements Plugin {
  #histogram: IntervalHistogram;
  name = EventLoopDelayPlugin.name;

  /**
   * Creates an instance of the class and initializes the event loop delay histogram.
   *
   * @param resolution - The sampling resolution in milliseconds for monitoring the event loop delay.
   *                     Defaults to `DEFAULT_RESOLUTION` if not provided.
   */
  constructor(private readonly resolution = DEFAULT_RESOLUTION) {
    this.#histogram = monitorEventLoopDelay({ resolution: this.resolution });
    this.#histogram.enable();
  }

  /**
   * Captures the current event loop delay statistics and stores the computed value in the provided context.
   *
   * The event loop delay is calculated as the mean value from the internal histogram (converted from nanoseconds to milliseconds)
   * minus the configured resolution. If the computed delay is not a number (NaN), it is set to positive infinity.
   * After capturing, the histogram is reset for the next measurement cycle.
   *
   * @param ctx - The context object where the event loop delay metric will be set.
   */
  capture(ctx: Context): void {
    ctx.set('eventLoopDelay', Math.max(0, this.#histogram.mean / 1e6 - this.resolution));

    if (Number.isNaN(ctx.get('eventLoopDelay')))
      ctx.set('eventLoopDelay', Number.POSITIVE_INFINITY);

    this.#histogram.reset();
  }
}
