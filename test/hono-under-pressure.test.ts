import { Hono } from 'hono';
import { underPressureHonoMiddleware, type MiddlewareOptions } from '../src/index.js';
import it, { describe, type TestContext } from 'node:test';

function setupHonoServer(options: Readonly<Partial<MiddlewareOptions>>) {
  const app = new Hono();

  app.use('*', underPressureHonoMiddleware(options));

  app.get('/', (c) => {
    return c.json({}, 200);
  });

  return app;
}

describe('underPressureHonoMiddleware', () => {
  it('should have the correct name', async (t: TestContext) => {
    t.plan(3);

    // Arrange
    const app = setupHonoServer({});

    // Act
    const response = await app.request('/');

    // Assert
    t.assert.strictEqual(response.status, 200);
    t.assert.strictEqual(response.headers.get('content-type'), 'application/json');
    t.assert.deepStrictEqual(await response.json(), {});
  });
});
