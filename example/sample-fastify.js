#!/usr/bin/env -S node

import { parseArgs } from 'node:util';
import { Metrics } from '../dist/index.js';
import { argv } from 'node:process';
import Fastify from 'fastify';

const args = parseArgs({
  args: argv.slice(2),
  allowPositionals: true,
  options: {
    metrics: { short: 'm', type: 'boolean', default: false }
  }
});

if (args.values.metrics) {
  Metrics.start({ webServerMetricsPort: 9090 });
}

const fastify = Fastify();

fastify.get('/', (_request, reply) => {
  reply.send({ hello: 'world' });
});

fastify.listen({ port: 3000 });
