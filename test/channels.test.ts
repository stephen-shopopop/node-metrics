import diagnostics_channel from 'node:diagnostics_channel';
import it, { describe, type TestContext } from 'node:test';
import { channels } from '../src/library/channels';

describe('channels', () => {
  it('should export an object with error, info, and metrics properties', (t: TestContext) => {
    t.plan(2);

    t.assert.ok(Reflect.has(channels, 'error'));
    t.assert.ok(Reflect.has(channels, 'info'));
  });

  it('should create the error channel with the correct name', (t: TestContext) => {
    t.plan(2);

    t.assert.strictEqual(channels.error.name, 'handling-web-server:error');
    t.assert.ok(channels.error instanceof diagnostics_channel.Channel);
  });

  it('should create the info channel with the correct name', (t: TestContext) => {
    t.plan(2);

    t.assert.strictEqual(channels.info.name, 'handling-web-server:info');
    t.assert.ok(channels.info instanceof diagnostics_channel.Channel);
  });
});
