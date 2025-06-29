import { Metrics } from '../dist/index.js';

const metrics = Metrics.start({ webServerMetricsPort: 8080, appName: 'service-with-prometheus' });

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    metrics
      .closeWebServerMetrics()
      .then(() => console.log('Metrics terminated'))
      .catch((error) => console.error('Error terminating metrics', error))
      .finally(() => process.exit(0));
  });
}
