import { Metrics, DebugPlugin } from '../dist/index.js';
import { setTimeout } from 'node:timers/promises';

const maxEventLoopDelay = 1e3;
const maxEventLoopUtilization = 0.98;
const blockEventLoopDelayInMs = 1500;
const blockEventLoopUtilizationInMs = 500;

const block = (msec) => {
  const start = Date.now();
  while (Date.now() - start < msec) {}
};

const metrics = Metrics.start({});
metrics.register(new DebugPlugin());
metrics.observer.attach(console.debug);

let i = 0;

while (true) {
  await setTimeout(10);

  process.nextTick(() => block(i > 10 ? blockEventLoopDelayInMs : blockEventLoopUtilizationInMs));

  const { event_loop_delay_milliseconds, event_loop_utilized } = metrics.measures();

  if (event_loop_delay_milliseconds > maxEventLoopDelay) {
    console.error('event loop delay blocked!');
  }

  if (event_loop_utilized > maxEventLoopUtilization) {
    console.error('event loop utilization blocked!');
  }

  if (i > 20) {
    process.exit(0);
  }

  i++;
}
