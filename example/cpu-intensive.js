import { DebugPlugin, Metrics } from '../dist/index.js';
import { setTimeout } from 'node:timers/promises';

function runCpuIntensiveTask() {
  function fibonacciRecursive(n) {
    if (n <= 1) {
      return n;
    }
    return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
  }

  fibonacciRecursive(45);
}

const metrics = Metrics.start({ webServerMetricsPort: 9090 });
metrics.register(new DebugPlugin());
metrics.observer.attach(console.debug);

while (true) {
  await setTimeout(1000);

  runCpuIntensiveTask();

  process.exit(0);
}
