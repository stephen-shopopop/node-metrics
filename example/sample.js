import { Metrics } from '../dist/index.js';
import { setTimeout } from 'node:timers/promises';

Metrics.start({ webServerMetricsPort: 9090 });

const smartMemoryLeak = new WeakMap();

export function runSmartMemoryLeakTask() {
  for (let i = 0; i < 10000; i++) {
    const person = {
      name: `Person number ${i}`,
      age: i
    };
    smartMemoryLeak.set(person, `I am a person number ${i}`);
  }
}

while (true) {
  await setTimeout(1000);

  runSmartMemoryLeakTask();
}
