import { DebugPlugin, Metrics } from '../dist/index.mjs';
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

const metrics = Metrics.start({});
metrics.register(new DebugPlugin());

while (true) {
  await setTimeout(1000);

  blockMemory();

  const { heap_used_bytes, rss_bytes } = metrics.values();

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
      maxHeapUsedBytes / (1024 * 1024)
    );

    process.exit(0);
  }
}
