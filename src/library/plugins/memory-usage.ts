import type { MetricsContext, Plugin } from '../definitions.js';

/**
 * Plugin that captures and records Node.js process memory usage statistics.
 *
 * This plugin retrieves memory usage metrics such as `heapUsed`, `heapTotal`, and `rssBytes`
 * from the Node.js process and sets them in the provided context.
 *
 * @implements {Plugin}
 */
export class MemoryUsagePlugin implements Plugin {
  name = MemoryUsagePlugin.name;

  /**
   * Captures the current Node.js process memory usage statistics and sets them in the provided context.
   *
   * @param ctx - The context object where memory usage metrics will be stored.
   *   - 'heapUsed': The amount of memory used by the V8 heap (in bytes).
   *   - 'heapTotal': The total size of the V8 heap (in bytes).
   *   - 'rssBytes': The resident set size, total memory allocated for the process execution (in bytes).
   */
  capture(ctx: MetricsContext): void {
    const mem = process.memoryUsage();

    ctx.set('heapUsed', mem.heapUsed).set('heapTotal', mem.heapTotal).set('rssBytes', mem.rss);
  }
}
