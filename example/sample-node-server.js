#!/usr/bin/env -S node

import http from 'node:http';
import { parseArgs } from 'node:util';
import { Metrics } from '../dist/index.js';
import { argv } from 'node:process';

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

const server = http.createServer((_req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ hello: 'world' }));
});

server.listen(3000);
