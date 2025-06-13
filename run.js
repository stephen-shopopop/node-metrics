import { Metrics } from './dist/index.mjs';
import { setTimeout } from 'node:timers/promises';

const metrics = Metrics.start({});

console.log(metrics.measures());

await setTimeout(3000);

console.log(metrics.measures());
