# VTEX IO App test action

This is a simple Github action that runs the `test` script of IO apps. The action searches for a `manifest.json` in the root of the project and for a `package.json` for each builder the manifest has.

## Usage

To basic usage, just add it to your workflow and you're done:

```yml
# someworkflow.yml
name: CI Pull Requests

on:
  pull_request:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
      - name: Use Node.js 12.x
        uses: actions/setup-node@master
        with:
          node-version: 12.x
        env:
          RUNNER_TEMP: /tmp

      - uses: vtex/action-io-app-test@master
```

form advance usage you can use the optional inputs testCommands and testedBuilders as follow

```yml
name: CI Pull Requests

on:
  pull_request:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
      - name: Use Node.js 12.x
        uses: actions/setup-node@master
        with:
          node-version: 12.x
        env:
          RUNNER_TEMP: /tmp

      - uses: vtex/action-io-app-test@master
        with:
          testedBuilders: node,react #builders names separated with comas
          testCommand: test-coverage,--passWithNoTests #project test command to be executed with it flags separated with comas
```