import assert from 'node:assert';
import test, { describe } from 'node:test';

describe('setup', () => {
  test('Timezone passing test', () => {
    // This test passes because it does not throw an exception.
    assert.strictEqual(process.env.TZ, 'UTC');
  });
});
