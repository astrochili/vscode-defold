import * as vscode from 'vscode'
import * as config from './config'
import * as utils from './utils'
import * as momento from './momento'
import * as extensions from './data/extensions'
import * as debuggers from './data/debuggers'
import log from './logger'

export async function migrateGlobal(fromVersion: string) {
    if (fromVersion == "2.0.5") {
        await migrateGlobalFrom205()
    } else {
        log(`Nothing to migrate globally, skipped.`)
    }

    await momento.setLastGlobalMigrationVersion(config.extension.version)
}

export async function migrateWorkspace(fromVersion: string) {
    if (fromVersion == '2.0.5') {
        await migrateWorkspaceFrom205()
    }

    if (utils.compareVersions(fromVersion, '2.0.7') <= 0) {
        await migrateWorkspaceFrom207()
    } else {
        log(`Nothing to migrate in the workspace, skipped.`)
    }

    await momento.setLastWorkspaceMigrationVersion(config.extension.version)
}

async function migrateGlobalFrom205() {
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
}

async function migrateWorkspaceFrom205() {
    const launchSettings = vscode.workspace.getConfiguration('launch')
    const configurations = launchSettings.get('configurations') as vscode.DebugConfiguration[]

    const configuration = configurations.find(existingConfiguration => {
        return existingConfiguration.name == 'Defold' && existingConfiguration.type == 'lua-local'
    })

    if (configuration) {
        log(`Migrating the launch configuration from 2.0.5`)

        configuration.name = debuggers.recommended[extensions.ids.localLuaDebugger].name
        configuration.preLaunchTask = debuggers.recommended[extensions.ids.localLuaDebugger].preLaunchTask

        await launchSettings.update('configurations', configurations)
    }
}

async function migrateWorkspaceFrom207() {
    const launchSettings = vscode.workspace.getConfiguration('launch')
    const configurations = launchSettings.get('configurations') as vscode.DebugConfiguration[]

    const configuration = configurations.find(existingConfiguration => {
        return existingConfiguration.name == 'Defold Kit' && existingConfiguration.type == 'lua-local'
    })

    if (configuration) {
        log(`Migrating the launch configuration from 2.0.7`)

        configuration.program = debuggers.recommended[extensions.ids.localLuaDebugger].program
        configuration.args = debuggers.recommended[extensions.ids.localLuaDebugger].args
        configuration.windows.program = debuggers.recommended[extensions.ids.localLuaDebugger].windows.program
        configuration.windows.args = debuggers.recommended[extensions.ids.localLuaDebugger].windows.args

        await launchSettings.update('configurations', configurations)
    }
}