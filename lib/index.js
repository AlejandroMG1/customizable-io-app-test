const { existsSync, readFileSync } = require('fs')
const { resolve } = require('path')

const { Toolkit } = require('actions-toolkit')

function resolveFromRoot(...paths) {
  return resolve(process.env.GITHUB_WORKSPACE, ...paths)
}

function isIOApp() {
  const manifestPath = resolveFromRoot('manifest.json')
  return existsSync(manifestPath)
}

function getJSONFile(...paths) {
  return JSON.parse(readFileSync(resolveFromRoot(...paths)))
}

// Run your GitHub Action!
Toolkit.run(async tools => {
  if (!isIOApp()) {
    tools.exit.success('Not an IO app. Skipping.')
    return
  }
  const rawTestedBuilders = tools.inputs.testedBuilders
  const testedBuilders = rawTestedBuilders?.split(',').map(builder => builder.trim())

  const rawTestCommand = tools.inputs.testCommand
  const testCommand = rawTestCommand?.split(',').map(builder => builder.trim()) || ['test', '--passWithNoTests']
  // no need to install root deps for now
  // await tools.runInWorkspace('yarn', ['install'])

  const { builders } = getJSONFile('manifest.json')
  for await (const builder of Object.keys(builders)) {
    if (testedBuilders && !testedBuilders.includes(builder)) {
      tools.log.info(`Skipping "${builder}" builder.`)
      continue
    }
    if (!existsSync(resolveFromRoot(builder, 'package.json'))) {
      tools.log.info(
        `No "package.json" found in the "${builder}" app. Skipping.`
      )
      continue
    }

    const { scripts } = getJSONFile(builder, 'package.json')
    if (scripts == null || !('test' in scripts)) {
      tools.log.warn(
        `No "test" script found in the "${builder}" app. Skipping.`
      )
      continue
    }

    try {
      // no need to install deps while testing
      if (process.env.NODE_ENV !== 'test') {
        tools.log.info(`Installing "${builder}" dependencies.`)

        await tools.runInWorkspace('yarn', ['install'], {
          cwd: resolveFromRoot(builder),
        })
      }

      await tools.runInWorkspace('yarn', testCommand, {
        cwd: resolveFromRoot(builder),
      })
    } catch (e) {
      tools.exit.failure(e)
      throw e
    }
  }

  tools.exit.success()
})
