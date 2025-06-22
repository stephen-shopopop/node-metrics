#!/usr/bin/env -S node

import { parseArgs } from 'node:util';
import { Metrics } from '../dist/index.js';
import { argv } from 'node:process';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';

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

const app = new Hono();
app.get('/', (c) => c.json({ hello: 'world' }));

serve(app);
