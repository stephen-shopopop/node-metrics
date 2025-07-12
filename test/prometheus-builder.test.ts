import { Counter, Gauge } from '../src/library/prometheus-builder';
import it, { describe, type TestContext } from 'node:test';
import { PrometheusBuild } from '../src/library/prometheus-builder';

describe('Gauge', () => {
  it('should create a registry with default label and prefix', (t: TestContext) => {
    t.plan(3);

    // Arrange
    const gauge = new Gauge('active_users', 42);

    // Act
    const metric = gauge.registry();

    // Assert
    t.assert.strictEqual(metric.help, '# HELP nodejs_active_users ');
    t.assert.strictEqual(metric.type, '# TYPE nodejs_active_users gauge');
    t.assert.strictEqual(metric.value, 'nodejs_active_users{service="unknown"} 42');
  });

  it('should create a registry with a custom label', (t: TestContext) => {
    t.plan(3);

    // Arrange
    const gauge = new Gauge('memory_usage', 128, 'Memory usage in MB');

    // Act
    const metric = gauge.registry();

    // Assert
    t.assert.strictEqual(metric.help, '# HELP nodejs_memory_usage Memory usage in MB');
    t.assert.strictEqual(metric.type, '# TYPE nodejs_memory_usage gauge');
    t.assert.strictEqual(metric.value, 'nodejs_memory_usage{service="unknown"} 128');
  });

  it('should create a registry with a custom prefix', (t: TestContext) => {
    t.plan(3);

    // Arrange
    const gauge = new Gauge('requests', 10, '', '', 'app_');

    // Act
    const metric = gauge.registry();

    // Assert
    t.assert.strictEqual(metric.help, '# HELP app_requests ');
    t.assert.strictEqual(metric.type, '# TYPE app_requests gauge');
    t.assert.strictEqual(metric.value, 'app_requests{service=""} 10');
  });

  it('should create a registry with both custom label and prefix', (t: TestContext) => {
    t.plan(3);

    // Arrange
    const gauge = new Gauge('errors', 3, 'Number of errors', '', 'svc_');

    // Act
    const metric = gauge.registry();

    // Assert
    t.assert.strictEqual(metric.help, '# HELP svc_errors Number of errors');
    t.assert.strictEqual(metric.type, '# TYPE svc_errors gauge');
    t.assert.strictEqual(metric.value, 'svc_errors{service=""} 3');
  });

  it('should handle zero and negative values', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const zeroGauge = new Gauge('zero_metric', 0);

    // Act
    const negativeGauge = new Gauge('negative_metric', -5);

    // Assert
    t.assert.strictEqual(zeroGauge.registry().value, 'nodejs_zero_metric{service="unknown"} 0');
    t.assert.strictEqual(
      negativeGauge.registry().value,
      'nodejs_negative_metric{service="unknown"} -5'
    );
  });
});

describe('Counter', () => {
  it('should create a registry with default label and prefix', (t: TestContext) => {
    t.plan(3);

    // Arrange
    const counter = new Counter('active_users', 42);

    // Act
    const metric = counter.registry();

    // Assert
    t.assert.strictEqual(metric.help, '# HELP nodejs_active_users ');
    t.assert.strictEqual(metric.type, '# TYPE nodejs_active_users counter');
    t.assert.strictEqual(metric.value, 'nodejs_active_users{service="unknown"} 42');
  });

  it('should create a registry with a custom label', (t: TestContext) => {
    t.plan(3);

    // Arrange
    const counter = new Counter('memory_usage', 128, 'Memory usage in MB');

    // Act
    const metric = counter.registry();

    // Assert
    t.assert.strictEqual(metric.help, '# HELP nodejs_memory_usage Memory usage in MB');
    t.assert.strictEqual(metric.type, '# TYPE nodejs_memory_usage counter');
    t.assert.strictEqual(metric.value, 'nodejs_memory_usage{service="unknown"} 128');
  });

  it('should create a registry with a custom prefix', (t: TestContext) => {
    t.plan(3);

    // Arrange
    const counter = new Counter('requests', 10, '', '', 'app_');

    // Act
    const metric = counter.registry();

    // Assert
    t.assert.strictEqual(metric.help, '# HELP app_requests ');
    t.assert.strictEqual(metric.type, '# TYPE app_requests counter');
    t.assert.strictEqual(metric.value, 'app_requests{service=""} 10');
  });

  it('should create a registry with both custom label and prefix', (t: TestContext) => {
    t.plan(3);

    // Arrange
    const counter = new Counter('errors', 3, 'Number of errors', '', 'svc_');

    // Act
    const metric = counter.registry();

    // Assert
    t.assert.strictEqual(metric.help, '# HELP svc_errors Number of errors');
    t.assert.strictEqual(metric.type, '# TYPE svc_errors counter');
    t.assert.strictEqual(metric.value, 'svc_errors{service=""} 3');
  });

  it('should handle zero and negative values', (t: TestContext) => {
    t.plan(2);

    // Arrange
    const zeroCounter = new Counter('zero_metric', 0);

    // Act
    const negativeCounter = new Counter('negative_metric', -5);

    // Assert
    t.assert.strictEqual(zeroCounter.registry().value, 'nodejs_zero_metric{service="unknown"} 0');
    t.assert.strictEqual(
      negativeCounter.registry().value,
      'nodejs_negative_metric{service="unknown"} -5'
    );
  });
});

describe('PrometheusBuild', () => {
  it('should register a gauge metric and output correct OpenMetrics format', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    const builder = new PrometheusBuild();
    builder.setGauge('active_users', 42, 'Number of active users');

    // Act
    const response = builder.printRegistries();
    const body = await response.text();

    // Assert
    t.assert.match(body, /# HELP nodejs_active_users Number of active users/);
    t.assert.match(body, /# TYPE nodejs_active_users gauge/);
    t.assert.match(body, /nodejs_active_users{service="unknown"} 42/);
  });

  it('should register a counter metric and output correct OpenMetrics format', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    const builder = new PrometheusBuild();
    builder.setCounter('active_users', 42, 'Number of active users');

    // Act
    const response = builder.printRegistries();
    const body = await response.text();

    // Assert
    t.assert.match(body, /# HELP nodejs_active_users Number of active users/);
    t.assert.match(body, /# TYPE nodejs_active_users counter/);
    t.assert.match(body, /nodejs_active_users{service="unknown"} 42/);
  });

  it('should apply prefix to all registered metrics', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    const builder = new PrometheusBuild('service-order');
    builder.setGauge('requests', 10, 'Number of requests');

    // Act
    const response = builder.printRegistries();
    const body = await response.text();

    // Assert
    t.assert.match(body, /# HELP nodejs_requests Number of requests/);
    t.assert.match(body, /# TYPE nodejs_requests gauge/);
    t.assert.match(body, /nodejs_requests{service="service-order"} 10/);
  });

  it('should register multiple metrics and output all in the response', async (t: TestContext) => {
    t.plan(4);

    // Arrange
    const builder = new PrometheusBuild('service-order');
    builder.setCounter('errors', 3, 'Number of errors');
    builder.setGauge('latency', 100, 'Request latency in ms');

    // Act
    const response = builder.printRegistries();
    const body = await response.text();

    // Assert
    t.assert.match(body, /# HELP nodejs_errors Number of errors/);
    t.assert.match(body, /nodejs_errors{service="service-order"} 3/);
    t.assert.match(body, /# HELP nodejs_latency Request latency in ms/);
    t.assert.match(body, /nodejs_latency{service="service-order"} 100/);
  });

  it('should set gauge with default label and prefix', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    const builder = new PrometheusBuild();
    builder.setGauge('foo', 1);

    // Act
    const response = builder.printRegistries();
    const body = await response.text();

    // Assert
    t.assert.match(body, /# HELP nodejs_foo /);
    t.assert.match(body, /# TYPE nodejs_foo gauge/);
    t.assert.match(body, /nodejs_foo{service="unknown"} 1/);
  });

  it('should set counter with default label and prefix', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    const builder = new PrometheusBuild();
    builder.setCounter('foo', 1);

    // Act
    const response = builder.printRegistries();
    const body = await response.text();

    // Assert
    t.assert.match(body, /# HELP nodejs_foo /);
    t.assert.match(body, /# TYPE nodejs_foo counter/);
    t.assert.match(body, /nodejs_foo{service="unknown"} 1/);
  });

  it('should return response with correct headers and status', async (t: TestContext) => {
    t.plan(2);

    // Arrange
    const builder = new PrometheusBuild();
    builder.setGauge('bar', 5);

    // Act
    const response = builder.printRegistries();

    // Assert
    t.assert.strictEqual(response.status, 200);
    t.assert.strictEqual(
      response.headers.get('Content-Type'),
      'text/plain; version=0.0.4; charset=utf-8'
    );
  });
});
