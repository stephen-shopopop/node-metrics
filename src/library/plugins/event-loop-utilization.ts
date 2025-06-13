import type { EventLoopUtilization } from 'node:perf_hooks';
import type { Context, Plugin } from '../definitions.js';

/**
 * A plugin that captures Node.js event loop utilization metrics.
 *
 * This plugin uses the `performance.eventLoopUtilization()` API to measure
 * how much of the event loop's time is being utilized, and stores the
 * utilization value in the provided context under the key `'eventLoopUtilized'`.
 *
 */
export class EventLoopUtilizationPlugin implements Plugin {
  #elu: EventLoopUtilization;
  name = EventLoopUtilizationPlugin.name;

  constructor() {
    this.#elu = performance.eventLoopUtilization();
  }

  /**
   * Captures the current event loop utilization and sets it in the provided context.
   *
   * @param ctx - The context object where the event loop utilization metric will be stored.
   *              The metric is stored under the key 'eventLoopUtilized'.
   *              If `this.elu` is defined, it uses `performance.eventLoopUtilization(this.elu).utilization`;
   *              otherwise, it sets the value to 0.
   */
  capture(ctx: Context): void {
    ctx.set(
      'eventLoopUtilized',
      this.#elu ? performance.eventLoopUtilization(this.#elu).utilization : 0
    );
  }
}
