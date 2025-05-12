import { Console } from 'node:console';

const logger = new Console({ stderr: process.stderr, stdout: process.stdout });

export default function () {
  logger.time('global-teardown');

  // ... Put your teardown

  // 👍🏼 We're ready
  logger.timeEnd('global-teardown');
}
