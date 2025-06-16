import { Metrics } from './dist/index.mjs';
import { setTimeout } from 'node:timers/promises';

function aggregateByObjectName(list) {
  const data = {};

  for (let i = 0; i < list.length; i++) {
    const listElement = list[i];

    if (!listElement || typeof listElement.constructor === 'undefined') {
      continue;
    }

    if (Object.hasOwnProperty.call(data, listElement.constructor.name)) {
      data[listElement.constructor.name] += 1;
    } else {
      data[listElement.constructor.name] = 1;
    }
  }
  return data;
}

const metrics = Metrics.start({});

console.log(metrics.values());

await setTimeout(3000);

console.log(process._getActiveHandles());
console.log('nodejs_active_handles', aggregateByObjectName(process._getActiveHandles()));

console.log(metrics.values());
