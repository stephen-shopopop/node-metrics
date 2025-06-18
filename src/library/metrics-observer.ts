import type { Observer } from './definitions.js';

/**
 * MetricsObservable class that manages metric observers
 *
 * @class MetricsObservable
 */
export class MetricsObservable {
  #observers: Observer[] = [];

  /**
   * Registers a new observer function if it's not already attached
   *
   * @param {Observer} func - The observer function to attach
   * @returns {void}
   */
  attach(func: Observer) {
    if (typeof func !== 'function' || this.#observers.includes(func)) {
      return;
    }
    this.#observers.push(func);
  }

  /**
   * Removes an observer function from the list of observers
   *
   * @param {Observer} func - The observer function to detach
   * @returns {void}
   */
  detach(func: Observer) {
    this.#observers = this.#observers.filter((observer) => observer !== func);
  }

  /**
   * Notifies all registered observers with a message and optional metadata
   *
   * @param {string | object} message - The message to send to observers
   * @param {object} [metadata] - Optional metadata to send to observers
   * @returns {void}
   */
  notify(message: string | object, metadata?: object) {
    for (const observer of this.#observers) {
      observer(message, metadata);
    }
  }
}
