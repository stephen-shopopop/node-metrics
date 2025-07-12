#!/usr/bin/env -S node

import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { argv } from 'node:process';
import { finished } from 'node:stream';
import { run } from 'node:test';
import reporters from 'node:test/reporters';
import { parseArgs } from 'node:util';
import githubReporter from '@reporters/github';

// Listen unhandledRejection
process.on('unhandledRejection', (err) => {
  console.error(err);

  process.exit(1);
});

const args = parseArgs({
  args: argv.slice(2),
  allowPositionals: true,
  options: {
    concurrency: { type: 'string', short: 'c', default: `${os.availableParallelism() - 1}` },
    'expose-gc': { type: 'boolean' },
    watch: { short: 'w', type: 'boolean', default: false },
    help: { short: 'h', type: 'boolean', default: false },
    pattern: {
      short: 'p',
      type: 'string',
      multiple: true,
      default:
        process.env.npm_lifecycle_script === 'tsx'
          ? [
              '**/**/*.test.ts',
              '**/*.test.{cjs,mjs,js}',
              '**/test/**/*.test.{cjs,mjs,js}',
              '**/*.test.{cts,mts,ts}',
              '**/test/**/*.test.{cts,mts,ts}'
            ].map((pattern) => path.join(process.cwd(), pattern))
          : ['**/*.test.{cjs,mjs,js}', '**/test/**/*.test.{cjs,mjs,js}'].map((pattern) =>
              path.join(process.cwd(), pattern)
            )
    },
    coverage: { short: 'C', type: 'boolean', default: false },
    reporter: { short: 'r', type: 'string', default: process.stdout.isTTY ? 'spec' : 'tap' },
    lines: { type: 'string', default: '90' },
    branches: { type: 'string', default: '90' },
    functions: { type: 'string', default: '90' },
    name: { short: 'n', type: 'string', default: undefined },
    timeout: { short: 't', type: 'string', default: '30000' },
    only: { short: 'o', type: 'boolean', default: false },
    forceExit: { short: 'F', type: 'boolean', default: false },
    rootDir: { type: 'string', default: 'test' }
  }
});

if (args.values?.help) {
  console.log(await readFile(new URL('./README.md', import.meta.url), 'utf8'));

  process.exit(0);
}

try {
  // see https://nodejs.org/api/test.html#runoptions
  const stream = run({
    execArgv: [args.values['expose-gc'] === true ? '--trace-gc' : ''].filter(Boolean),
    concurrency: Number.parseInt(args.values.concurrency, 10),
    coverage: args.values.coverage,
    coverageExcludeGlobs: args.values.pattern,
    files: args.positionals.length > 0 ? args.positionals.map((f) => path.resolve(f)) : undefined,
    // See https://nodejs.org/api/test.html#running-tests-from-the-command-line
    globPatterns: args.positionals.length > 0 ? [] : args.values.pattern,
    lineCoverage: Number.parseInt(args.values.lines, 10),
    branchCoverage: Number.parseInt(args.values.branches, 10),
    functionCoverage: Number.parseInt(args.values.functions, 10),
    only: args.values.only,
    testNamePatterns: args.values.name,
    setup: async () => {
      // Call setUp
      if (fs.existsSync(path.join(process.cwd(), args.values.rootDir, 'setup.js'))) {
        await import(path.join(process.cwd(), args.values.rootDir, 'setup.js')).then((x) =>
          x.default()
        );
      }
    },
    timeout: Number.parseInt(args.values.timeout, 10),
    watch: args.values.watch
  });

  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.once(signal, () => {
      // Destroy stream to call teardown correctly
      stream.destroy();

      // Enforce exit for tsx
      process.exit(1);
    });
  }

  // Log test failures to console
  stream.on('test:fail', (testFail) => {
    console.error(testFail);

    process.exitCode = 1; // must be != 0, to avoid false positives in CI pipelines
  });

  // Call tearDown
  finished(stream, async () => {
    if (fs.existsSync(path.join(process.cwd(), args.values.rootDir, 'teardown.js'))) {
      await import(path.join(process.cwd(), args.values.rootDir, 'teardown.js')).then((x) =>
        x.default()
      );
    }

    process.exit = 0;
  });

  stream.compose(reporters[args.values.reporter]).pipe(process.stdout);

  // If we're running in a GitHub action, adds the gh reporter
  // by default so that we can report failures to GitHub
  if (process.env.GITHUB_ACTION) {
    stream.compose(githubReporter).pipe(process.stdout);
  }

  process.exit = 0;
} catch (err) {
  console.error(err);

  process.exitCode = 1;
}
