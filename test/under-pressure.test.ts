import it, { describe, type TestContext } from 'node:test';
import { isUnderPressure } from '../src/library/middleware/under-pressure.js';

describe('isUnderPressure', () => {
  it('should return true when event loop delay exceeds maximum', (t: TestContext) => {
    t.plan(1);

    // Act & Assert
    t.assert.ok(
      isUnderPressure({
        maxEventLoopDelay: 100,
        event_loop_delay_milliseconds: 150
      })
    );
  });

  it('should return true when heap usage exceeds maximum', (t: TestContext) => {
    t.plan(1);

    // Act & Assert
    t.assert.ok(
      isUnderPressure({
        maxHeapUsedBytes: 1000,
        heap_used_bytes: 1500
      })
    );
  });

  it('should return true when RSS exceeds maximum', (t: TestContext) => {
    t.plan(1);

    // Act & Assert
    t.assert.ok(
      isUnderPressure({
        maxRssBytes: 2000,
        rss_bytes: 2500
      })
    );
  });

  it('should return true when event loop utilization exceeds maximum', (t: TestContext) => {
    t.plan(1);

    // Act & Assert
    t.assert.ok(
      isUnderPressure({
        maxEventLoopUtilization: 0.8,
        event_loop_utilized: 0.9
      })
    );
  });

  it('should return false when all metrics are below maximum', (t: TestContext) => {
    t.plan(1);

    // Act & Assert
    t.assert.ok(
      !isUnderPressure({
        maxEventLoopDelay: 200,
        maxHeapUsedBytes: 2000,
        maxRssBytes: 3000,
        maxEventLoopUtilization: 0.9,
        event_loop_delay_milliseconds: 100,
        heap_used_bytes: 1000,
        rss_bytes: 2000,
        event_loop_utilized: 0.5
      })
    );
  });

  it('should return false when no thresholds are set', (t: TestContext) => {
    t.plan(1);

    // Act & Assert
    t.assert.ok(!isUnderPressure({}));
  });
});
