import type { MetricsContext, Plugin } from '../definitions.js';

/**
 * Aggregates an array of resource names into an object mapping each resource to its count.
 *
 * @param resources - An array of resource names (strings) to be aggregated.
 * @returns An object where each key is a resource name and the value is the number of times it appears in the input array.
 */
const aggregateResources = (resources: string[]) => {
  const data: Record<string, number> = {};

  for (const resource of resources) {
    if (Reflect.has(data, resource) && typeof data[resource] === 'number') {
      data[resource] += 1;
    } else {
      data[resource] = 1;
    }
  }

  return data;
};

/**
 * A plugin for capturing and recording information about active Node.js resources.
 *
 * @remarks
 * This plugin is useful for monitoring resource usage and diagnosing resource leaks
 * in Node.js applications.
 *
 * @implements {Plugin}
 */
export class ActiveResourcesInfoPlugin implements Plugin {
  name = ActiveResourcesInfoPlugin.name;

  /**
   * Captures information about the currently active Node.js resources and stores
   * the aggregated data in the provided metrics context.
   *
   * @param ctx - The metrics context where the aggregated active resources information
   *              will be set under the key 'metadata.nodejs_active_resources'.
   */
  capture(ctx: MetricsContext): void {
    const resources = process.getActiveResourcesInfo();

    ctx.set('metadata.nodejs_active_resources', aggregateResources(resources));
  }
}
