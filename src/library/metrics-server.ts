import type { Server } from 'node:http';
import { closeWebServer, createWebServer } from './web-server.js';
import type { AddressInfo } from 'node:net';
import type { Context, MetricsContext } from './definitions.js';
import { PrometheusBuild } from './prometheus-builder.js';
import type { MetricsObservable } from './metrics-observer.js';
import { isUnderPressure } from './middleware/under-pressure.js';
import {
  CHANNEL_TOPIC_METRICS,
  MAX_EVENT_LOOP_DELAY,
  MAX_EVENT_LOOP_UTILIZATION
} from './constants.js';

/**
 * Provides a metrics server for exposing application and process metrics.
 *
 * The `MetricsServer` class initializes and manages a web server that exposes
 * metrics endpoints for Prometheus scraping and real-time metrics streaming.
 * It supports graceful startup and shutdown, notifies observers of server events,
 * and provides access to collected metrics such as event loop delay, memory usage,
 * and CPU statistics.
 *
 * @remarks
 * - The `/metrics` endpoint returns Prometheus-formatted metrics.
 * - The `/metrics-stream` endpoint provides a real-time event stream of metrics updates. `curl -H Accept:text/event-stream http://localhost:9090/metrics-stream`
 * - Observers are notified of server lifecycle events and incoming requests.
 *
 * @public
 */
export class MetricsServer {
  #server: Server | undefined;
  #address: AddressInfo | undefined;
  #appName: `${string}-${string}` | undefined;

  constructor(
    private readonly metricsContext: MetricsContext,
    private readonly observer: MetricsObservable
  ) {
    /** */
  }

  async #fetchCallback(context: Context): Promise<Response> {
    this.observer.notify(
      `${context.method} http://${context.headers['host']}${context.path}?${new URLSearchParams(Object.entries(context.query)).toString()}`
    );

    const {
      event_loop_delay_milliseconds = 0,
      event_loop_utilized = 0,
      heap_used_bytes = 0,
      heap_total_bytes = 0,
      rss_bytes = 0,
      process_start_time_seconds = 0,
      process_cpu_user_seconds_total = 0,
      process_cpu_system_seconds_total = 0,
      process_cpu_seconds_total = 0
    } = this.metricsContext.toJson();

    if (
      isUnderPressure({
        event_loop_delay_milliseconds,
        event_loop_utilized,
        maxEventLoopDelay: MAX_EVENT_LOOP_DELAY,
        maxEventLoopUtilization: MAX_EVENT_LOOP_UTILIZATION
      })
    ) {
      return new Response('Service Unavailable', {
        headers: [['Retry-After', '10']],
        status: 503
      });
    }

    if (context.method === 'GET' && context.path === '/metrics') {
      return new PrometheusBuild(this.#appName)
        .setGauge(
          'event_loop_delay_milliseconds',
          event_loop_delay_milliseconds,
          'The mean of the recorded event loop delays'
        )
        .setGauge(
          'event_loop_utilized',
          event_loop_utilized,
          'The percentage of event loop utilization'
        )
        .setGauge('heap_used_bytes', heap_used_bytes, 'The amount of memory used by the V8 heap')
        .setGauge('heap_total_bytes', heap_total_bytes, 'The total size of the V8 heap.')
        .setGauge(
          'rss_bytes',
          rss_bytes,
          'The resident set size, or total memory allocated for the process'
        )
        .setGauge(
          'process_start_time_seconds',
          process_start_time_seconds,
          'The process start time, represented in seconds since the Unix epoch'
        )
        .setGauge(
          'process_cpu_user_seconds_total',
          process_cpu_user_seconds_total,
          'The total user CPU time consumed by the process, in seconds'
        )
        .setGauge(
          'process_cpu_system_seconds_total',
          process_cpu_system_seconds_total,
          'The total system CPU time consumed by the process, in seconds'
        )
        .setGauge(
          'process_cpu_seconds_total',
          process_cpu_seconds_total,
          'The total CPU time (user + system) consumed by the process, in seconds'
        )
        .printRegistries();
    }

    if (context.method === 'GET' && context.path === '/metrics-stream') {
      const channel = new BroadcastChannel(CHANNEL_TOPIC_METRICS);

      const stream = new ReadableStream({
        start: (controller) => {
          controller.enqueue(`: Welcome to #${CHANNEL_TOPIC_METRICS} message!\n\n`);

          channel.onmessage = (message: unknown) => {
            const event = message as MessageEvent;

            controller.enqueue(
              `data: ${JSON.stringify({
                ts: new Date().toISOString(),
                type: event.type,
                payload: event.data
              })}\n\n`
            );
          };
        },
        cancel() {
          channel.close();
        }
      });

      return new Response(stream.pipeThrough(new TextEncoderStream()), {
        headers: {
          'Transfer-Encoding': 'chunked',
          connection: 'keep-alive',
          'cache-control': 'no-cache',
          'content-type': 'text/event-stream'
        }
      });
    }

    return new Response();
  }

  /**
   * Starts the metrics server on the specified port.
   *
   * Initializes a web server using the provided port and sets up a fetch callback
   * to handle incoming requests. Notifies observers about the server startup and
   * stores the server and address instances for later use.
   *
   * @param port - The port number on which the metrics server should listen.
   * @param appName - (Optional) The application name in the format `${string}-${string}`.
   * @returns A promise that resolves when the server has started.
   */
  async start(port: number, appName?: `${string}-${string}`): Promise<void> {
    this.#appName = appName;

    const { server, address } = await createWebServer({
      port,
      fetchCallback: (ctx) => this.#fetchCallback(ctx)
    });

    this.observer.notify(`Starting metrics server on ${address.port}`, { ...address });

    this.#server = server;
    this.#address = address;
  }

  /**
   * Gracefully shuts down the metrics server.
   *
   * Notifies observers that the metrics server is stopping and then closes the underlying web server.
   *
   * @returns {Promise<void>} A promise that resolves when the server has been successfully closed.
   */
  async destroy(): Promise<void> {
    this.observer.notify('Stopping metrics server');

    await closeWebServer(this.#server);
  }

  /**
   * Retrieves the address information associated with the server.
   *
   * @returns {AddressInfo | undefined} The address information if available; otherwise, `undefined`.
   */
  getAddressInfo(): AddressInfo | undefined {
    return this.#address;
  }
}
