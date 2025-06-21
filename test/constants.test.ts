import {
  CHANNEL_TOPIC_METRICS,
  DEFAULT_RESOLUTION,
  DEFAULT_SAMPLE_INTERVAL,
  MAX_EVENT_LOOP_DELAY,
  MAX_EVENT_LOOP_UTILIZATION
} from '../src/library/constants.js';
import it, { describe, type TestContext } from 'node:test';

describe('constants', () => {
  it('should export DEFAULT_RESOLUTION with value 10', (t: TestContext) => {
    t.plan(1);

    t.assert.strictEqual(DEFAULT_RESOLUTION, 10);
  });

  it('should export DEFAULT_SAMPLE_INTERVAL with value 1000', (t: TestContext) => {
    t.plan(1);

    t.assert.strictEqual(DEFAULT_SAMPLE_INTERVAL, 1000);
  });

  it('should have DEFAULT_RESOLUTION as a number', (t: TestContext) => {
    t.plan(1);

    t.assert.strictEqual(typeof DEFAULT_RESOLUTION, 'number');
  });

  it('should have DEFAULT_SAMPLE_INTERVAL as a number', (t: TestContext) => {
    t.plan(1);

    t.assert.strictEqual(typeof DEFAULT_SAMPLE_INTERVAL, 'number');
  });

  it('should export MAX_EVENT_LOOP_DELAY with value 1000', (t: TestContext) => {
    t.plan(1);
    t.assert.strictEqual(MAX_EVENT_LOOP_DELAY, 1000);
  });

  it('should export MAX_EVENT_LOOP_UTILIZATION with value 0.98', (t: TestContext) => {
    t.plan(1);
    t.assert.strictEqual(MAX_EVENT_LOOP_UTILIZATION, 0.98);
  });

  it('should have MAX_EVENT_LOOP_DELAY as a number', (t: TestContext) => {
    t.plan(1);
    t.assert.strictEqual(typeof MAX_EVENT_LOOP_DELAY, 'number');
  });

  it('should have MAX_EVENT_LOOP_UTILIZATION as a number', (t: TestContext) => {
    t.plan(1);
    t.assert.strictEqual(typeof MAX_EVENT_LOOP_UTILIZATION, 'number');
  });

  it('should export BROADCAST_CHANNEL_TOPIC_METRICS with value "channel:metrics"', (t: TestContext) => {
    t.plan(1);
    t.assert.strictEqual(CHANNEL_TOPIC_METRICS, 'channel:metrics');
  });

  it('should have BROADCAST_CHANNEL_TOPIC_METRICS as a string', (t: TestContext) => {
    t.plan(1);
    t.assert.strictEqual(typeof CHANNEL_TOPIC_METRICS, 'string');
  });
});
