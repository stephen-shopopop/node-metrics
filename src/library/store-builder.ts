/**
 * A generic builder class for managing and storing metric values.
 *
 * The `StoreBuilder` class provides a type-safe way to set, get, and serialize data.
 * It uses a generic type parameter `T` to define the shape of the store object.
 *
 * ## Example
 * ```ts
 * import assert from 'node:assert';
 *
 * const metrics = new StoreBuilder();
 * metrics.set('heapUsed', 12);
 * assert.equal(metrics.get('heapUsed'), 12);
 * assert.deepStrictEqual(metrics.toJson(), { heapUsed: 12 });
 * ```
 */
export class StoreBuilder<T extends object = { [key: PropertyKey]: unknown }> {
  #dictionary = new Map();

  /**
   * Set store value
   *
   * # Example
   *
   * ```ts
   * import assert from 'node:assert';
   *
   * const metrics = new StoreBuilder();
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
   * Get store value
   *
   * # Example
   *
   * ```ts
   * import assert from 'node:assert';
   *
   * const metrics = new StoreBuilder();
   * metrics.set('heapUsed', 12);
   *
   * assert.equal(metrics.get('heapUsed'), 12 );
   * ```
   */
  get<E extends keyof T>(key: E): T[E] | undefined {
    return this.#dictionary.get(key);
  }

  /**
   * Convert store to json
   *
   * # Example
   *
   * ```ts
   * import assert from 'node:assert';
   *
   * const metrics = new StoreBuilder();
   * metrics.set('heapUsed', 12);
   *
   * assert.deepStrictEqual(metrics.toJson(), { heapUsed: 12 } );
   * ```
   */
  toJson(): Readonly<T> {
    return Object.freeze(Object.fromEntries(this.#dictionary)) as Readonly<T>;
  }
}
