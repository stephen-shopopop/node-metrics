#!/usr/bin/env -S node

import http from 'node:http';
import { parseArgs } from 'node:util';
import { Metrics } from '../dist/index.js';
import { argv } from 'node:process';
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';

const args = parseArgs({
  args: argv.slice(2),
  allowPositionals: true,
  options: {
    metrics: { short: 'm', type: 'boolean', default: false }
  }
});

let numCPUs = Math.max(1, availableParallelism() - 1);

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Metrics for process master
  Metrics.start({ webServerMetricsPort: 9091 });

  // Fork workers.
  for (; numCPUs > 0; numCPUs--) {
    cluster.fork();
  }

  cluster.on('exit', (worker, _code, _signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });

  cluster.on('online', (worker) => {
    console.info(`ℹ Worker ${String(worker.process.pid)} is online`);
  });
} else {
  if (args.values.metrics) {
    // Listener all workers
    // const channel = new BroadcastChannel('channel:metrics');
    // channel.onmessage = (msg) => console.log(msg.data);

    // Metrics for workers
    Metrics.start({ webServerMetricsPort: 9090 });
  }

  // Workers can share any TCP connection
  const server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ hello: 'world' }));
  });

  server.listen(3000);
}
