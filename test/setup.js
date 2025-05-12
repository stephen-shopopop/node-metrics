import { Console } from 'node:console';

const logger = new Console({ stderr: process.stderr, stdout: process.stdout });

export default function () {
  // ️️️✅ Best Practice: force UTC
  process.env.TZ = 'UTC';

  logger.time('global-setup');

  // ... Put your setup

  // 👍🏼 We're ready
  logger.timeEnd('global-setup');
}
