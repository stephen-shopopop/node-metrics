import type { MetricsContext, Plugin } from '../definitions.js';

/**
 * Plugin for capturing and reporting the CPU usage of the current Node.js process.
 *
 * This plugin measures the user and system CPU time consumed by the process since the last capture,
 * and sets the corresponding metrics in the provided `MetricsContext`.
 *
 * @implements {Plugin}
 */
export class ProcessCpuUsagePlugin implements Plugin {
  private cpuUsage: NodeJS.CpuUsage;

  name = ProcessCpuUsagePlugin.name;

  constructor() {
    this.cpuUsage = process.cpuUsage();
  }

  /**
   * Captures the current process CPU usage and records the metrics in the provided context.
   *
   * @param ctx - The metrics context used to store CPU usage metrics.
   *
   * Sets the following metrics in the context:
   * - `process_cpu_user_seconds_total`: Total user CPU time in seconds.
   * - `process_cpu_system_seconds_total`: Total system CPU time in seconds.
   * - `process_cpu_seconds_total`: Total CPU time (user + system) in seconds.
   */
  capture(ctx: MetricsContext): void {
    const { user, system } = process.cpuUsage(this.cpuUsage);

    ctx
      .set('process_cpu_user_seconds_total', user / 1e6)
      .set('process_cpu_system_seconds_total', system / 1e6)
      .set('process_cpu_seconds_total', (user + system) / 1e6);
  }
}
