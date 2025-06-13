import http from 'node:http';
import { performance } from 'node:perf_hooks';
import { monitorEventLoopDelay } from 'node:perf_hooks';

const options = {
  maxEventLoopDelay: 1000,
  maxHeapUsedBytes: 100000000,
  maxRssBytes: 100000000,
  maxEventLoopUtilization: 0.98
};

function underPressure() {
  const resolution = 10;

  let heapUsed = 0;
  let heapTotal = 0;
  let rssBytes = 0;
  let eventLoopUtilized = 0;
  let eventLoopDelay = 0;

  const histogram = monitorEventLoopDelay({ resolution });
  histogram.enable();

  // Get the ELU from the start of the thread.
  const elu = performance.eventLoopUtilization();

  function getSampleInterval(value, eventLoopResolution) {
    const sampleInterval = value || 1000;

    return Math.max(eventLoopResolution, sampleInterval);
  }

  const sampleInterval = getSampleInterval(1000, resolution);

  function updateEventLoopUtilization() {
    if (elu) {
      eventLoopUtilized = performance.eventLoopUtilization(elu).utilization;
    } else {
      eventLoopUtilized = 0;
    }
  }

  function updateEventLoopDelay() {
    eventLoopDelay = Math.max(0, histogram.mean / 1e6 - resolution);

    if (Number.isNaN(eventLoopDelay)) eventLoopDelay = Number.POSITIVE_INFINITY;

    histogram.reset();
  }

  function updateMemoryUsage() {
    const mem = process.memoryUsage();

    heapUsed = mem.heapUsed;
    heapTotal = mem.heapTotal;
    rssBytes = mem.rss;

    updateEventLoopDelay();
    updateEventLoopUtilization();
  }

  function beginMemoryUsageUpdate() {
    console.table({
      heap_usage: heapUsed,
      heap_total_usage: heapTotal,
      rssBytes: rssBytes,
      heap_usage_MB: heapUsed / (1024 * 1024),
      heap_total_usage_MB: heapTotal / (1024 * 1024),
      rssBytes_MB: rssBytes / (1024 * 1024),
      eventLoopUtilized,
      eventLoopDelay: eventLoopDelay,
      isUnderPressure: isUnderPressure(),
      startInSec: Math.round(Date.now() / 1000 - process.uptime())
    });

    updateMemoryUsage();
    timer.refresh();
  }

  // eslint-disable-next-line no-unused-vars
  function onClose() {
    clearTimeout(timer);
  }

  const timer = setTimeout(beginMemoryUsageUpdate, sampleInterval);
  timer.unref();

  function isUnderPressure() {
    if (eventLoopDelay > 0 && eventLoopDelay > options.maxEventLoopDelay) {
      return true;
    }

    if (heapUsed > 0 && heapUsed > options.maxHeapUsedBytes) {
      return true;
    }

    if (rssBytes > 0 && rssBytes > options.maxRssBytes) {
      return true;
    }

    return eventLoopUtilized > 0 && eventLoopUtilized > options.maxEventLoopUtilization;
  }
}

underPressure();

function blockLoop() {
  let obj = { a: 1 };
  const niter = 20;
  for (let i = 0; i < niter; i++) {
    obj = { obj1: obj, obj2: obj }; // Object grows exponentially
  }

  JSON.stringify(obj); // Blocking here
}

const server = http.createServer((req, res) => {
  blockLoop();

  res.end('test');
});
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8000);
