import { DebugPlugin, Metrics } from '../dist/index.js';
import { setTimeout } from 'node:timers/promises';

const maxHeapUsedBytes = 100_000_000;
const maxRssBytes = 100_000_000;

const blockMemory = () => {
  let obj = { a: 1 };
  const niter = 20;
  for (let i = 0; i < niter; i++) {
    obj = { obj1: obj, obj2: obj }; // Object grows exponentially
  }

  JSON.stringify(obj); // Blocking here
};

const metrics = Metrics.start({ webServerMetricsPort: 9090 });
metrics.register(new DebugPlugin());
metrics.observer.attach(console.debug);

console.log(`Process ${process.pid} is running - go to http://127.0.0.1:9090`);

await setTimeout(5000);

while (true) {
  await setTimeout(1000);

  blockMemory();

  const { heap_used_bytes, rss_bytes } = metrics.measures();

  if (heap_used_bytes > maxHeapUsedBytes) {
    console.error('heap used max');
  }

  if (rss_bytes > maxRssBytes) {
    console.error(
      'Max rss - total memory allocated for the process execution: %s MB',
      rss_bytes / (1024 * 1024)
    );

    process.exit(0);
  }

  if (heap_used_bytes > maxHeapUsedBytes) {
    console.error(
      'Max heap used - The amount of memory used by the V8 heap: %s MB',
      heap_used_bytes / (1024 * 1024)
    );

    process.exit(0);
  }
}
