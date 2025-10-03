#!/usr/bin/env -S node

import Fastify from 'fastify';
import { underPressureFastifyPlugin } from '../dist/index.js';

const fastify = Fastify({ logger: true });

// Register the under-pressure plugin
await fastify.register(
  underPressureFastifyPlugin({
    appName: 'test-fastify',
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100000000,
    maxRssBytes: 100000000,
    maxEventLoopUtilization: 0.98,
    retryAfter: 10,
    webServerMetricsPort: 9090
  })
);

fastify.get('/', async (_request, _reply) => {
  return { hello: 'world', timestamp: Date.now() };
});

fastify.get('/health', async (_request, _reply) => {
  return { status: 'ok' };
});

try {
  await fastify.listen({ port: 3000, host: '127.0.0.1' });
  console.log('Server listening on http://127.0.0.1:3000');
  console.log('Metrics available on http://127.0.0.1:9090');
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
