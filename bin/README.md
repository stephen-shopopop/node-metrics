# runner

Runner is a wrapper test runner for `node:test`.

Runner is self-hosted, i.e. Runner runs its own tests.

## Usage

### javascript

```bash
node ./bin/test-runner.js
```

Runner will automatically run all tests files matching `*.test.{js}`.

### typescript

```bash
npx tsx ./bin/test-runner.js
```

### Run multiple specify files

```bash
node ./bin/test-runner.js *.test.js *.test.mjs
```

Runner will automatically run all tests files matching `*.test.{js|ts}`.

## Options

- `--concurrency` or `-c`, to set the number of concurrent tests. Defaults to the number of available CPUs minus one.
- `--coverage` or `-C`, enables code coverage. Default is `false`
- `--watch` or `-w`, re-run tests on changes. Default is `false`
- `--only` or `-o`, only run `node:test` with the `only` option set. Default is `false`
- `--forceExit` or `-F`, finished executing even if the event loop would otherwise remain active. Default is `false`
- `--expose-gc`, exposes the gc() function to tests. Default is `false`
- `--reporter` or `-r`, set up a reporter
- `--pattern` or `-p`, run tests matching the given glob pattern. Default is `*.test.{js|ts}`
- `--name` or `-n`, run tests name matching the given glob pattern. Default is `undefined`. ex: `--name="#myTag"`
- `--timeout` or `-t`, timeouts the tests after a given time. Default is 30000ms
- `--lines`, set the lines threshold when check coverage is active; default is 100
- `--functions`, set the functions threshold when check coverage is active; default is 100
- `--branches`, set the branches threshold when check coverage is active; default is 100
- `--rootDir`, set rootDir to setup and teardown.

## Reporters

Here are the available reporters:

- `tap`: outputs the test results in the TAP format.
- `spec`: outputs the test results in a human-readable format.
- `dot`: outputs the test results in a compact format, where each passing test is represented by a ., and each failing test is represented by a X.
- `junit`: outputs test results in a jUnit XML format

## Setup

```bash
.
├── src
│   └── lib
│      ├── math.ts
│      └── math.test.ts
├── test <rootDir>
│   ├── setup.js
│   ├── teardown.js
│   └── components
│       └── compute.test.ts
└── tsconfig.json (typescript project)
```

Create file `setup.js`

```js
export default function () {
  // ️️️✅ Best Practice: force UTC
  process.env.TZ = "UTC";

  console.time("global-setup");

  // ... Put your setup

  // 👍🏼 We're ready
  console.timeEnd("global-setup");
}
```

## Teardown

Create file `teardown.js`

```js
export default function () {
  console.time("global-teardown");

  // ... Put your teardown

  // 👍🏼 We're ready
  console.timeEnd("global-teardown");
}
```

## Reference

[Run node test](https://nodejs.org/api/test.html#runoptions)
