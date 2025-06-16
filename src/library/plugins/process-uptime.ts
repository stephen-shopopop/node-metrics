import type { MetricsContext, Plugin } from '../definitions.js';

/**
 * A plugin that captures the process start time in seconds since the Unix epoch.
 *
 * @remarks
 * Useful for monitoring and observability tools that require the process start time.
 *
 * @implements {Plugin}
 */
export class ProcessUpTimePlugin implements Plugin {
  name = ProcessUpTimePlugin.name;

  /**
   * Captures and records the process start time in seconds since the Unix epoch.
   *
   * @param ctx - The metrics context used to store the 'process_start_time_seconds' metric.
   * The value is calculated as the current time in seconds minus the process uptime.
   */
  capture(ctx: MetricsContext): void {
    ctx.set('process_start_time_seconds', Math.round(Date.now() / 1e3 - process.uptime()));
  }
}
