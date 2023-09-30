/*!
 * Defold Kit
 * https://github.com/astrochili/vscode-defold
 * Copyright (c) 2023 Roman Silin
 * MIT license
 *
 * The Defold name is a registered trademark of the Defold Foundation.
 * https://defold.com
 */

import * as vscode from 'vscode'
import * as config from './config'
import * as wizard from './wizard'
import * as annotations from './annotations'
import * as extensions from './data/extensions'
import * as bob from './bob'
import * as launcher from './launcher'
import * as deployer from './deployer'
import * as utils from './utils'
import path = require('path')
import log from './logger'

export async function setup() {
    const defold = await wizard.offerSelectDefoldPath()

    if (!defold) {
        log(`Setup is cancelled during the Defold Editor's path dialog`)
        return
    }

    const installedExtensionIds = await wizard.offerInstallExtensions()
    if (!installedExtensionIds) {
        log('Setup is cancelled during the extensions installation dialog')
        return
    }

    const areSettingsApplyed = await wizard.offerApplySettings(installedExtensionIds)
    if (!areSettingsApplyed) {
        log('Setup is cancelled during the applying settings dialog')
        return
    }

    if (installedExtensionIds.includes(extensions.ids.luaLanguageServer) || vscode.extensions.getExtension(extensions.ids.luaLanguageServer)) {
        const areAnnotationsSynced = await wizard.offerSyncAnnotations(defold.version)
        if (!areAnnotationsSynced) {
            log('Setup is cancelled during the annotations syncing dialog')
            return
        }
    } else {
        log(`There is no '${extensions.ids.luaLanguageServer}' extensions installed so the annotations syncyng is skipped`)
    }

    config.didOnceSetup()
    vscode.window.showInformationMessage(`${config.extension.displayName} setup has been finished`)
}

export async function syncAnnotations() {
    const defold = config.defold

    if (!defold) {
        return wizard.suggestSetup(`Syncing API annotations requires to setup ${config.extension.displayName} first`)
    }

    if (!vscode.extensions.getExtension(extensions.ids.luaLanguageServer)) {
        return wizard.suggestSetup(`Syncing API annotations requires to install the '${extensions.ids.luaLanguageServer}' extension first`)
    }

    const areAnnotationsSynced = await wizard.offerSyncAnnotations(defold.version, 'Syncing API annotations')

    if (areAnnotationsSynced) {
        vscode.window.showInformationMessage(`Syncing API annotations completed`)
    }
}

export async function cleanAnnotations() {
    const defold = config.defold

    if (!defold) {
        return wizard.suggestSetup(`Cleaning API annotations requires to setup ${config.extension.displayName} first`)
    }

    const isClean = await annotations.cleanAnnotations()

    if (isClean) {
        vscode.window.showInformationMessage(`Cleaning API annotations completed`)
    }
}

export async function cleanBuild() {
    const defold = config.defold

    if (!defold) {
        return wizard.suggestSetup(`Cleaning the build requires to setup ${config.extension.displayName} first`)
    }

    if (!await utils.isPathExists(config.paths.workspaceBuild)) {
        vscode.window.showInformationMessage(`There is no build folder to clean`)
        return
    }

    const isClean = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Cleaning the build folder...'
    }, async progress => {
        return await bob.cleanBuild(defold)
    })

    if (isClean) {
        vscode.window.showInformationMessage(`Build cleaning completed`)
    }
}

export async function resolve() {
    const defold = config.defold

    if (!defold) {
        return wizard.suggestSetup(`Resolving dependencies requires to setup ${config.extension.displayName} first`)
    }

    const email = utils.settingsString(config.settingsKeys.dependenciesEmail)
    const auth = utils.settingsString(config.settingsKeys.dependenciesAuthToken)

    const isResolved = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Resolving dependencies...'
    }, async progress => {
        return await bob.resolve(defold, {
            email: email,
            auth: auth
        })
    })

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Extracting dependencies annotations...'
    }, async progress => {
        return annotations.syncDependenciesAnnotations()
    })

    if (isResolved) {
        vscode.window.showInformationMessage(`Dependencies resolved`)
    }
}

export async function bundle() {
    const defold = config.defold

    if (!defold) {
        return wizard.suggestSetup(`Bundling requires to setup ${config.extension.displayName} first`)
    }

    const targets = await wizard.offerSelectBundleTargets()

    if (!targets || targets.length == 0) {
        log('Bundle is cancelled during the targets dialog')
        return
    }

    const options = await wizard.offerSelectBundleOptions()

    if (!options) {
        log('Bundle is cancelled during the options dialog')
        return
    }

    let bundlePath: string | undefined

    for (const target of targets) {
        const iosProvisioningProfileSettingsKey = options.isRelease ? config.settingsKeys.iosReleaseProvisioningProfile : config.settingsKeys.iosDebugProvisioningProfile
        const iosProvisioningProfile = utils.settingsString(iosProvisioningProfileSettingsKey)

        const iosIdentitySettingsKey = options.isRelease ? config.settingsKeys.iosReleaseIdentity : config.settingsKeys.iosDebugIdentity
        const iosIdentity = utils.settingsString(iosIdentitySettingsKey)

        const androidKeystore = options.isRelease ? utils.settingsString(config.settingsKeys.androidKeystore) : undefined
        const androidKeystorePass = options.isRelease ? utils.settingsString(config.settingsKeys.androidKeystorePass) : undefined
        const androidKeystoreAlias = options.isRelease ? utils.settingsString(config.settingsKeys.androidKeystoreAlias) : undefined

        log(`Bundling for ${target}`)

        bundlePath = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Bundling for ${target}...`
        }, async progress => {
            return await bob.bundle(defold, {
                target: target,
                release: options.isRelease,
                textureCompression: options.textureCompression,
                buildReport: options.buildReport,
                debugSymbols: options.debugSymbols,
                liveUpdate: options.liveUpdate,
                iosMobileProvisioning: iosProvisioningProfile,
                iosIdentity: iosIdentity,
                androidKeystore: androidKeystore,
                androidKeystorePass: androidKeystorePass,
                androidKeystoreAlias: androidKeystoreAlias,
                androidBundleFormat: config.constants.androidBundleFormats,
            })
        })

        if (bundlePath) {
            const pathToOpen = bundlePath

            vscode.window.showInformationMessage(
                `Bundle for ${target} has been finished`,
                'Open Bundle'
            ).then( shouldOpen => {
                if (shouldOpen) {
                    vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(pathToOpen))
                }
            })
        } else {
            vscode.window.showWarningMessage(`Failed to bundle for ${target}. See Output for details.`)
        }
    }
}

export async function deploy() {
    const iosItem: vscode.QuickPickItem = {
        label: '$(device-mobile) iOS',
        detail: 'Deploy the .ipa file with the `ios-deploy -b` command',
        alwaysShow: true
    }

    const androidItem: vscode.QuickPickItem = {
        label: '$(device-mobile) Android',
        detail: 'Deploy the .apk file with the `adb install` command',
        alwaysShow: true
    }

    const targetItems = [
        iosItem,
        androidItem
    ]

    const targetItem = await vscode.window.showQuickPick(targetItems, {
        canPickMany: false,
        title: 'Deploy Target',
        placeHolder: 'Select a target platform to deploy',
        ignoreFocusOut: false,
    })

    if (!targetItem) {
        log('Deploy is cancelled during the target dialog')
        return
    }

    const target = targetItem == iosItem ? 'iOS' : 'Android'

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Deploying for ${targetItem.label}...`
    }, async progress => {
        return await deployer.deploy(target)
    })
}

export async function build() {
    const defold = config.defold

    if (!defold) {
        return wizard.suggestSetup(`Building requires to setup ${config.extension.displayName} first`)
    }

    if (!await utils.isPathExists(config.paths.workspaceLibs)) {
        await resolve()
    }

    const isBuilded = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Building...'
    }, async progress => {
        return await bob.build(defold)
    })

    if (!isBuilded) {
        vscode.window.showErrorMessage('Failed to build for running. See Output for details.')
        return
    }

    const isPrepared = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Preparing to Launch...'
    }, async progress => {
        return await launcher.prepare(defold)
    })

    if (!isPrepared) {
        vscode.window.showErrorMessage('Failed to prepare the launcher. See Output for details.')
    }
}