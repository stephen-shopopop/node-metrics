#!/usr/bin/env -S node

import { parseArgs } from 'node:util';
import { Metrics } from '../dist/index.js';
import { argv } from 'node:process';
import express from 'express';

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

const app = express();

app.disable('etag');
app.disable('x-powered-by');

app.get('/', (_req, res) => {
  res.json({ hello: 'world' });
});

app.listen(3000);
