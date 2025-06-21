import diagnostics_channel from 'node:diagnostics_channel';

/**
 * An object containing pre-defined diagnostics channels for the web server.
 *
 * @property error   The diagnostics channel for error events, used for subscribing to and publishing error-related messages.
 * @property info    The diagnostics channel for informational events, used for subscribing to and publishing info messages.
 *
 * These channels are intended to be used with Node.js's `diagnostics_channel` module for structured event handling.
 */
export const channels = {
  /**
   * ```ts
   * import diagnostics_channel from ‘node:diagnostics_channel’
   *
   * diagnostics_channel.subscribe(‘handling-web-server:error’, (message, name) => {
   *  console.log(message, name)
   * })
   * ```
   */
  error: diagnostics_channel.channel('handling-web-server:error'),
  info: diagnostics_channel.channel('handling-web-server:info')
};
