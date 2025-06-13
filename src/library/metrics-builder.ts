import type { MetricsValues } from './definitions.js';

/**
 * A generic builder class for managing and storing metric values.
 *
 * The `MetricsBuilder` class provides a type-safe way to set, get, and serialize metrics.
 * It uses a generic type parameter `T` to define the shape of the metrics object.
 *
 * @typeParam T - The type of the metrics object. Defaults to `MetricsValues`.
 *
 * ## Example
 * ```ts
 * import assert from 'node:assert';
 *
 * const metrics = new MetricsBuilder();
 * metrics.set('heapUsed', 12);
 * assert.equal(metrics.get('heapUsed'), 12);
 * assert.deepStrictEqual(metrics.toJson(), { heapUsed: 12 });
 * ```
 */
export class MetricsBuilder<T extends object = MetricsValues> {
  #dictionary = new Map();

  /**
   * Set metric value
   *
   * # Example
   *
   * ```ts
   * import assert from 'node:assert';
   *
   * const metrics = new MetricsBuilder();
   * metrics.set('heapUsed', 12);
   *
   * assert.equal(metrics.get('heapUsed'), 12 );
   * ```
   */
  set<E extends keyof T>(key: E, value: T[E]): this {
    this.#dictionary.set(key, value);

    return this;
  }

  /**
   * Get metric value
   *
   * # Example
   *
   * ```ts
   * import assert from 'node:assert';
   *
   * const metrics = new MetricsBuilder();
   * metrics.set('heapUsed', 12);
   *
   * assert.equal(metrics.get('heapUsed'), 12 );
   * ```
   */
  get<E extends keyof T>(key: E): T[E] | undefined {
    return this.#dictionary.get(key);
  }

  /**
   * Convert metrics to json
   *
   * # Example
   *
   * ```ts
   * import assert from 'node:assert';
   *
   * const metrics = new MetricsBuilder();
   * metrics.set('heapUsed', 12);
   *
   * assert.deepStrictEqual(metrics.toJson(), { heapUsed: 12 } );
   * ```
   */
  toJson(): Readonly<T> {
    return Object.freeze(Object.fromEntries(this.#dictionary)) as Readonly<T>;
  }
}
