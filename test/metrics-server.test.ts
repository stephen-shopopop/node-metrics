import { test, beforeEach, describe, type TestContext, afterEach } from 'node:test';
import { MetricsServer } from '../src/library/metrics-server.js';
import { StoreBuilder } from '../src/library/store-builder.js';
import type { MetricsValues } from '../src/index.js';
import { MetricsObservable } from '../src/library/metrics-observer.js';
const fs = await import('node:fs');
import { PATH_VIEW_TEMPLATE } from '../src/library/constants.js';
import path from 'node:path';

const template = `# HELP nodejs_event_loop_delay_milliseconds The mean of the recorded event loop delays
# TYPE nodejs_event_loop_delay_milliseconds gauge
nodejs_event_loop_delay_milliseconds{service="unknown"} 0
# HELP nodejs_event_loop_utilized The percentage of event loop utilization
# TYPE nodejs_event_loop_utilized gauge
nodejs_event_loop_utilized{service="unknown"} 0
# HELP nodejs_heap_used_bytes The amount of memory used by the V8 heap
# TYPE nodejs_heap_used_bytes gauge
nodejs_heap_used_bytes{service="unknown"} 0
# HELP nodejs_heap_total_bytes The total size of the V8 heap.
# TYPE nodejs_heap_total_bytes gauge
nodejs_heap_total_bytes{service="unknown"} 0
# HELP nodejs_rss_bytes The resident set size, or total memory allocated for the process
# TYPE nodejs_rss_bytes gauge
nodejs_rss_bytes{service="unknown"} 0
# HELP nodejs_array_buffers_bytes Memory allocated for ArrayBuffers and SharedArrayBuffers
# TYPE nodejs_array_buffers_bytes gauge
nodejs_array_buffers_bytes{service="unknown"} 0
# HELP nodejs_external_bytes Memory used by C++ objects bound to JavaScript objects managed by V8
# TYPE nodejs_external_bytes gauge
nodejs_external_bytes{service="unknown"} 0
# HELP nodejs_process_start_time_seconds The process start time, represented in seconds since the Unix epoch
# TYPE nodejs_process_start_time_seconds gauge
nodejs_process_start_time_seconds{service="unknown"} 0
# HELP nodejs_process_cpu_user_seconds_total The total user CPU time consumed by the process, in seconds
# TYPE nodejs_process_cpu_user_seconds_total gauge
nodejs_process_cpu_user_seconds_total{service="unknown"} 0
# HELP nodejs_process_cpu_system_seconds_total The total system CPU time consumed by the process, in seconds
# TYPE nodejs_process_cpu_system_seconds_total gauge
nodejs_process_cpu_system_seconds_total{service="unknown"} 0
# HELP nodejs_process_cpu_seconds_total The total CPU time (user + system) consumed by the process, in seconds
# TYPE nodejs_process_cpu_seconds_total gauge
nodejs_process_cpu_seconds_total{service="unknown"} 0`;

const templateWithAppName = `# HELP nodejs_event_loop_delay_milliseconds The mean of the recorded event loop delays
# TYPE nodejs_event_loop_delay_milliseconds gauge
nodejs_event_loop_delay_milliseconds{service="service-order"} 0
# HELP nodejs_event_loop_utilized The percentage of event loop utilization
# TYPE nodejs_event_loop_utilized gauge
nodejs_event_loop_utilized{service="service-order"} 0
# HELP nodejs_heap_used_bytes The amount of memory used by the V8 heap
# TYPE nodejs_heap_used_bytes gauge
nodejs_heap_used_bytes{service="service-order"} 0
# HELP nodejs_heap_total_bytes The total size of the V8 heap.
# TYPE nodejs_heap_total_bytes gauge
nodejs_heap_total_bytes{service="service-order"} 0
# HELP nodejs_rss_bytes The resident set size, or total memory allocated for the process
# TYPE nodejs_rss_bytes gauge
nodejs_rss_bytes{service="service-order"} 0
# HELP nodejs_array_buffers_bytes Memory allocated for ArrayBuffers and SharedArrayBuffers
# TYPE nodejs_array_buffers_bytes gauge
nodejs_array_buffers_bytes{service="service-order"} 0
# HELP nodejs_external_bytes Memory used by C++ objects bound to JavaScript objects managed by V8
# TYPE nodejs_external_bytes gauge
nodejs_external_bytes{service="service-order"} 0
# HELP nodejs_process_start_time_seconds The process start time, represented in seconds since the Unix epoch
# TYPE nodejs_process_start_time_seconds gauge
nodejs_process_start_time_seconds{service="service-order"} 0
# HELP nodejs_process_cpu_user_seconds_total The total user CPU time consumed by the process, in seconds
# TYPE nodejs_process_cpu_user_seconds_total gauge
nodejs_process_cpu_user_seconds_total{service="service-order"} 0
# HELP nodejs_process_cpu_system_seconds_total The total system CPU time consumed by the process, in seconds
# TYPE nodejs_process_cpu_system_seconds_total gauge
nodejs_process_cpu_system_seconds_total{service="service-order"} 0
# HELP nodejs_process_cpu_seconds_total The total CPU time (user + system) consumed by the process, in seconds
# TYPE nodejs_process_cpu_seconds_total gauge
nodejs_process_cpu_seconds_total{service="service-order"} 0`;

describe('MetricsServer', () => {
  let metricsServer: MetricsServer;
  const metricsContext = new StoreBuilder<MetricsValues>();
  const metricsObserver = new MetricsObservable();

  beforeEach(() => {
    // Instance MetricServer
    metricsServer = new MetricsServer(metricsContext, metricsObserver);
  });

  afterEach(async () => {
    // Clean state
    await metricsServer.destroy();
  });

  test('should start server on specified port', async (t: TestContext) => {
    t.plan(1);

    // Arrange
    await metricsServer.start(9090);

    // Act
    const addressInfo = metricsServer.getAddressInfo();

    // Assert
    t.assert.ok(addressInfo);
  });

  test('should return undefined address info when server not started', (t: TestContext) => {
    t.plan(1);

    // Act
    const addressInfo = metricsServer.getAddressInfo();

    // Assert
    t.assert.deepStrictEqual(addressInfo, undefined);
  });

  test('should expose metrics endpoint with prometheus format', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    await metricsServer.start(3000);

    // Arrange
    const response = await fetch(
      `http://localhost:${metricsServer.getAddressInfo()?.port}/metrics`
    );
    const metricsText = await response.text();

    // Assert
    t.assert.strictEqual(response.status, 200);
    t.assert.strictEqual(
      response.headers.get('content-type'),
      'text/plain; version=0.0.4; charset=utf-8'
    );
    t.assert.strictEqual(metricsText, template);
  });

  test('should expose metrics endpoint with prefix prometheus format ', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    await metricsServer.start(3000, 'service-order');

    // Arrange
    const response = await fetch(
      `http://localhost:${metricsServer.getAddressInfo()?.port}/metrics`
    );
    const metricsText = await response.text();

    // Assert
    t.assert.strictEqual(response.status, 200);
    t.assert.strictEqual(
      response.headers.get('content-type'),
      'text/plain; version=0.0.4; charset=utf-8'
    );
    t.assert.strictEqual(metricsText, templateWithAppName);
  });

  test('should return empty response for non-metrics endpoints', async (t: TestContext) => {
    t.plan(2);

    // Arrange
    await metricsServer.start(3000);

    // Act
    const response = await fetch(
      `http://localhost:${metricsServer.getAddressInfo()?.port}/invalid`
    );

    // Assert
    t.assert.strictEqual(response.status, 200);
    t.assert.strictEqual(await response.text(), '');
  });

  test('should expose metrics-stream endpoint with event-stream headers', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    await metricsServer.start(3000);

    // Act
    const response = await fetch(
      `http://localhost:${metricsServer.getAddressInfo()?.port}/metrics-stream`,
      { headers: { Accept: 'text/event-stream' }, signal: AbortSignal.timeout(100) }
    );

    // Assert
    t.assert.strictEqual(response.status, 200);
    t.assert.strictEqual(response.headers.get('content-type'), 'text/event-stream');

    const reader = response.body?.getReader();
    // biome-ignore lint/style/noNonNullAssertion: Use for testing
    const { value } = await reader!.read();
    const text = new TextDecoder().decode(value);
    t.assert.match(text, /Welcome to #/);
  });

  test('should return default response if view html is not found', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    await metricsServer.start(3000);

    // Act
    const response = await fetch(`http://localhost:${metricsServer.getAddressInfo()?.port}`, {
      signal: AbortSignal.timeout(100)
    });
    const text = await response.text();

    // Assert
    t.assert.strictEqual(response.status, 200);
    t.assert.strictEqual(response.headers.get('content-type'), 'text/plain; charset=UTF-8');
    t.assert.strictEqual(text, '');
  });

  test('should notify observer on server start and stop', async (t: TestContext) => {
    t.plan(2);

    // Arrange
    let startNotified = false;
    let stopNotified = false;

    const observer = {
      notify: (msg: string) => {
        if (msg.startsWith('Starting metrics server')) startNotified = true;
        if (msg === 'Stopping metrics server') stopNotified = true;
      }
    } as unknown as MetricsObservable;

    const server = new MetricsServer(metricsContext, observer);

    // Act
    await server.start(3000);
    await server.destroy();

    // Assert
    t.assert.strictEqual(startNotified, true);
    t.assert.strictEqual(stopNotified, true);
  });

  test('should serve HTML if view template exists', async (t: TestContext) => {
    t.plan(2);

    // Arrange

    const htmlContent = '<html><body>Metrics</body></html>';
    fs.mkdirSync(path.dirname(PATH_VIEW_TEMPLATE));
    fs.writeFileSync(PATH_VIEW_TEMPLATE, htmlContent);

    await metricsServer.start(3002);

    // Act
    const response = await fetch(`http://localhost:${metricsServer.getAddressInfo()?.port}/`);
    const text = await response.text();

    // Assert
    t.assert.strictEqual(response.headers.get('content-type'), 'text/html');
    t.assert.strictEqual(text, htmlContent);

    // Cleanup
    fs.unlinkSync(PATH_VIEW_TEMPLATE);
    fs.rmdirSync(path.dirname(PATH_VIEW_TEMPLATE));
  });

  test('should return 503 when system is under pressure', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    await metricsServer.start(3000);
    metricsContext.set('event_loop_delay_milliseconds', 2000); // Above threshold
    metricsContext.set('event_loop_utilized', 0.99); // Above threshold

    // Act
    const response = await fetch(
      `http://localhost:${metricsServer.getAddressInfo()?.port}/metrics`
    );

    // Assert
    t.assert.strictEqual(response.status, 503);
    t.assert.strictEqual(response.headers.get('retry-after'), '10');
    t.assert.strictEqual(await response.text(), 'Service Unavailable');
  });
});
