import type { MetricsContext, Plugin } from '../definitions.js';

// Extend NodeJS.Process to include _getActiveHandles (undocumented API)
declare global {
  namespace NodeJS {
    interface Process {
      _getActiveHandles(): object[];
    }
  }
}

/**
 * Aggregates an array of objects by their constructor name, counting the number of occurrences for each type.
 *
 * @param handles - An array of objects to be aggregated.
 * @returns An object where the keys are constructor names and the values are the counts of objects with that constructor.
 */
const aggregateByObjectName = (handles: object[]) => {
  const data: Record<string, number> = {};

  for (const handle of Object.values(handles)) {
    if (!handle || typeof handle.constructor === 'undefined') {
      continue;
    }

    const { name: handleName } = handle.constructor;

    if (Object.hasOwn(data, handleName) && typeof data[handleName] === 'number') {
      data[handleName] += 1;
    } else {
      data[handleName] = 1;
    }
  }

  return data;
};

/**
 * A plugin that captures and records the current active Node.js handles.
 *
 * @remarks
 * This plugin relies on the internal Node.js method `process._getActiveHandles()`,
 * which may change between Node.js versions and is not part of the public API.
 */
export class ActiveHandlesPlugin implements Plugin {
  name = ActiveHandlesPlugin.name;

  /**
   * Captures the current active handles in the Node.js process and records their aggregated
   * counts by object name into the provided MetricsContext.
   *
   * @param ctx - The MetricsContext instance where the aggregated active handle data will be stored.
   */
  capture(ctx: MetricsContext): void {
    ctx.set('metadata.nodejs_active_handles', aggregateByObjectName(process._getActiveHandles()));
  }
}
