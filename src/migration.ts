import * as vscode from 'vscode'
import * as config from './config'
import * as momento from './momento'
import * as extensions from './data/extensions'
import * as debuggers from './data/debuggers'
import log from './logger'

export async function migrate(fromVersion: string) {
    if (fromVersion == "2.0.5") {
        await migrateFrom205()
    } else {
        log(`Nothing to migrate, skipped.`)
    }

    await momento.setLastMigrationVersion(config.extension.version)
}

async function migrateFrom205() {
    const oldKeys = [
        'defold.general.editorPath',
        'defold.general.suggestSetup',
        'defold.general.showBobOutput',
        'defold.annotations.repository',
        'defold.dependencies.email',
        'defold.dependencies.authToken',
        'defold.bundle.ios.debug.provisioningProfile',
        'defold.bundle.ios.debug.identity',
        'defold.bundle.ios.release.provisioningProfile',
        'defold.bundle.ios.release.identity',
        'defold.bundle.android.keystore',
        'defold.bundle.android.keystorePass',
        'defold.bundle.android.keystoreAlias'
    ]

    for (const oldKey of oldKeys) {
        const value = vscode.workspace.getConfiguration().get(oldKey)

        if (value == undefined) {
            continue
        }

        const newKey = oldKey.replace('defold.', 'defoldKit.')

        try {
            log(`Migrating settings value from ${oldKey} to ${newKey}`)
            await vscode.workspace.getConfiguration().update(newKey, value, true)
        } catch (error) {
            log(`${error}`, { openOutput: true })
        }
    }

    const launchSettings = vscode.workspace.getConfiguration('launch')
    const configurations = launchSettings.get('configurations') as vscode.DebugConfiguration[]

    const configuration = configurations.find(existingConfiguration => {
        return existingConfiguration.name == 'Defold' && existingConfiguration.type == 'lua-local'
    })

    if (configuration) {
        log(`Migrating the launch configuration...`)
        configuration.name = debuggers.recommended[extensions.ids.localLuaDebugger].name
        configuration.preLaunchTask = debuggers.recommended[extensions.ids.localLuaDebugger].preLaunchTask
        await launchSettings.update('configurations', configurations)
    }
}