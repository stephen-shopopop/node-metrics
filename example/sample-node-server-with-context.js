#!/usr/bin/env -S node

import http from 'node:http';
import { parseArgs } from 'node:util';
import { Metrics } from '../dist/index.js';
import { argv } from 'node:process';
import { AsyncLocalStorage } from 'node:async_hooks';

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

const asyncLocalStorage = new AsyncLocalStorage();

const server = http.createServer((_req, res) => {
  asyncLocalStorage.run(new Map(), () => {
    const store = asyncLocalStorage.getStore();
    store.set('requestId', Math.random().toString(36).substring(2, 15));

    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ hello: 'world', requestId: store.get('requestId') }));
  });
});

server.listen(3000);
