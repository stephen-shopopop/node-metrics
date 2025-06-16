import type { MetricsContext, Plugin } from '../definitions.js';

/**
 * Plugin that captures and records Node.js process memory usage statistics.
 *
 * This plugin retrieves memory usage metrics such as `heap_used_bytes`, `heap_total_bytes`, and `rss_bytes`
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
   *   - 'heap_used_bytes': The amount of memory used by the V8 heap (in bytes).
   *   - 'heap_total_bytes': The total size of the V8 heap (in bytes).
   *   - 'rss_bytes': The resident set size, total memory allocated for the process execution (in bytes).
   */
  capture(ctx: MetricsContext): void {
    const mem = process.memoryUsage();

    ctx
      .set('heap_used_bytes', mem.heapUsed)
      .set('heap_total_bytes', mem.heapTotal)
      .set('rss_bytes', mem.rss);
  }
}
