#!/usr/bin/env -S node

import { parseArgs } from 'node:util';
import { Metrics } from '../dist/index.js';
import { argv } from 'node:process';
import Koa from 'koa';

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

const app = new Koa();

app.use((ctx) => {
  ctx.body = { hello: 'world' };
});

const _server = app.listen(3000);

process.on('SIGINT', () => {
  _server.close();
});
