import { test, beforeEach, describe, type TestContext, afterEach } from 'node:test';
import { MetricsServer } from '../src/library/metrics-server.js';
import { StoreBuilder } from '../src/library/store-builder.js';
import type { MetricsValues } from '../src/index.js';
import { MetricsObservable } from '../src/library/metrics-observer.js';

const template = `# HELP event_loop_delay_milliseconds The mean of the recorded event loop delays
# TYPE event_loop_delay_milliseconds gauge
event_loop_delay_milliseconds 0
# HELP event_loop_utilized The percentage of event loop utilization
# TYPE event_loop_utilized gauge
event_loop_utilized 0
# HELP heap_used_bytes The amount of memory used by the V8 heap
# TYPE heap_used_bytes gauge
heap_used_bytes 0
# HELP heap_total_bytes The total size of the V8 heap.
# TYPE heap_total_bytes gauge
heap_total_bytes 0
# HELP rss_bytes The resident set size, or total memory allocated for the process
# TYPE rss_bytes gauge
rss_bytes 0
# HELP process_start_time_seconds The process start time, represented in seconds since the Unix epoch
# TYPE process_start_time_seconds gauge
process_start_time_seconds 0
# HELP process_cpu_user_seconds_total The total user CPU time consumed by the process, in seconds
# TYPE process_cpu_user_seconds_total gauge
process_cpu_user_seconds_total 0
# HELP process_cpu_system_seconds_total The total system CPU time consumed by the process, in seconds
# TYPE process_cpu_system_seconds_total gauge
process_cpu_system_seconds_total 0
# HELP process_cpu_seconds_total The total CPU time (user + system) consumed by the process, in seconds
# TYPE process_cpu_seconds_total gauge
process_cpu_seconds_total 0`;

const templateWithPrefix = `# HELP node_event_loop_delay_milliseconds The mean of the recorded event loop delays
# TYPE node_event_loop_delay_milliseconds gauge
node_event_loop_delay_milliseconds 0
# HELP node_event_loop_utilized The percentage of event loop utilization
# TYPE node_event_loop_utilized gauge
node_event_loop_utilized 0
# HELP node_heap_used_bytes The amount of memory used by the V8 heap
# TYPE node_heap_used_bytes gauge
node_heap_used_bytes 0
# HELP node_heap_total_bytes The total size of the V8 heap.
# TYPE node_heap_total_bytes gauge
node_heap_total_bytes 0
# HELP node_rss_bytes The resident set size, or total memory allocated for the process
# TYPE node_rss_bytes gauge
node_rss_bytes 0
# HELP node_process_start_time_seconds The process start time, represented in seconds since the Unix epoch
# TYPE node_process_start_time_seconds gauge
node_process_start_time_seconds 0
# HELP node_process_cpu_user_seconds_total The total user CPU time consumed by the process, in seconds
# TYPE node_process_cpu_user_seconds_total gauge
node_process_cpu_user_seconds_total 0
# HELP node_process_cpu_system_seconds_total The total system CPU time consumed by the process, in seconds
# TYPE node_process_cpu_system_seconds_total gauge
node_process_cpu_system_seconds_total 0
# HELP node_process_cpu_seconds_total The total CPU time (user + system) consumed by the process, in seconds
# TYPE node_process_cpu_seconds_total gauge
node_process_cpu_seconds_total 0`;

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
    await metricsServer.start(3000, 'node_');

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
    t.assert.strictEqual(metricsText, templateWithPrefix);
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
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const { value } = await reader!.read();
    const text = new TextDecoder().decode(value);
    t.assert.match(text, /Welcome to #/);
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
