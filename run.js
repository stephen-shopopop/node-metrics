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

function aggregateResource(resources) {
  const data = {};

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];

    if (Object.hasOwn(data, resource)) {
      data[resource] += 1;
    } else {
      data[resource] = 1;
    }
  }

  return data;
}

const metrics = Metrics.start({});

console.log(metrics.values());

await setTimeout(3000);

console.log('nodejs_active_handles', aggregateByObjectName(process._getActiveHandles()));

const { user, system } = process.cpuUsage();

console.table({
  process_cpu_user_seconds_total: user / 1e6,
  process_cpu_system_seconds_total: system / 1e6,
  process_cpu_seconds_total: (user + system) / 1e6
});

console.log(
  'process_start_time_seconds',
  Math.round(Date.now() / 1000 - process.uptime()),
  'seconds'
);

console.table({ nodejs_active_resources: aggregateResource(process.getActiveResourcesInfo()) });

console.table({ nodejs_version_info: process.versions.node });

console.table({ nodejs_active_requests: aggregateByObjectName(process._getActiveRequests()) });

console.log(metrics.values());
