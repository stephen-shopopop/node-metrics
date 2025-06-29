import { Metrics } from '../dist/index.js';

const metrics = Metrics.start({ webServerMetricsPort: 8080, appName: 'service-with-prometheus' });

process.on('SIGTERM', () => {
  metrics
    .closeWebServerMetrics()
    .then(() => console.log('Metrics terminated'))
    .catch((error) => console.error('Error terminating metrics', error))
    .finally(() => process.exit(0));
});
