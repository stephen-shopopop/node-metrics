import { Console } from 'node:console';
import type { MetricsContext, Plugin } from '../definitions.js';

/**
 * Console instance for logging to stdout and stderr.
 * Uses process.stdout for standard output and process.stderr for error output.
 *
 * @const {Console} logger - Logger instance for debugging purposes
 */
export const logger = new Console({ stderr: process.stderr, stdout: process.stdout });

/**
 * A plugin implementation that logs metric context data for debugging purposes.
 *
 * @remarks
 * The `DebugPlugin` captures the current `MetricsContext` and logs its JSON representation
 * using the application's debug logger. This is useful for development and troubleshooting.
 */
export class DebugPlugin implements Plugin {
  name = DebugPlugin.name;

  /**
   * Captures the current metrics context and logs its JSON representation at the debug level.
   *
   * @param ctx - The metrics context to be captured and logged.
   */
  capture(ctx: MetricsContext): void {
    logger.debug(ctx.toJson());
  }
}
