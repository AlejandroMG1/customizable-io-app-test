const { existsSync, readFileSync } = require('fs')
const { resolve } = require('path')

const core = require('@actions/core')
const exec = require('@actions/exec');

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

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
    try {
        if (!isIOApp()) {
            console.log('Not an IO app. Skipping.')
            return
        }

        const rawTestedBuilders = core.getInput('testedBuilders', {
            required: false,
        })
        const testedBuilders =
            rawTestedBuilders !== ''
                ? rawTestedBuilders.split(',').map(builder => builder.trim())
                : null
        const rawTestCommand = core.getInput('testCommand', { required: false })
        const testCommand =
            rawTestCommand !== ''
                ? rawTestCommand.split(',').map(builder => builder.trim())
                : ['test', '--passWithNoTests']
        const { builders } = getJSONFile('manifest.json')

        for await (const builder of Object.keys(builders)) {
            if (
                rawTestedBuilders &&
                testedBuilders !== '' &&
                !testedBuilders.includes(builder)
            ) {
                console.log(`Skipping "${builder}" builder.`)
                continue
            }
            if (!existsSync(resolveFromRoot(builder, 'package.json'))) {
                console.log(
                    `No "package.json" found in the "${builder}" app. Skipping.`
                )
                continue
            }

            const { scripts } = getJSONFile(builder, 'package.json')
            if (scripts == null || !('test' in scripts)) {
                console.log(
                    `No "test" script found in the "${builder}" app. Skipping.`
                )
                continue
            }

            try {
                // no need to install deps while testing
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`Installing "${builder}" dependencies.`)
                    await exec.exec('yarn', ['install'], {
                        cwd: resolveFromRoot(builder),
                    })
                }

                exec.exec('yarn', testCommand, {
                    cwd: resolveFromRoot(builder),
                })
            } catch (e) {
                core.setFailed(e.message)
                throw e
            }
        }
    } catch (error) {
        // Fail the workflow run if an error occurs
        core.setFailed(error.message)
    }
}

module.exports = {
    run,
}
