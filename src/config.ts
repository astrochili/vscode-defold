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
import * as utils from './utils'
import log from './logger'
import path = require('path')
import fs = require('fs')
const ini = require('ini')

export let context: vscode.ExtensionContext
export let workspaceFolder: vscode.WorkspaceFolder
export let paths: PathsConfig
export let defold: DefoldConfiguration | undefined

export namespace extension {

    export let id: string
    export let name: string
    export let displayName: string

}

export const platforms = {
    windows: 'win32',
    macos: 'darwin',
    linux: 'linux'
}

export const defoldPathSuggestion = {
    [platforms.windows]: 'C:\\Program Files\\Defold',
    [platforms.macos]: '/Applications/Defold.app',
    [platforms.linux]: '/usr/bin/Defold'
}[process.platform]

export const constants = {
    homedirShortcut: '~',
    gameProject: 'game.project',
    bobClass: 'com.dynamo.bob.Bob',
    sumnekoSettingsLibraryKey: 'Lua.workspace.library',
    androidBundleFormats: 'aab,apk'
}

export const momentoKeys = {
    dontSuggestSetup: 'dontSuggestSetup',
    bundleTarget: 'bundleTarget',
    bundleOption: 'bundleOption',
    extensionInstallation: 'extensionInstallation',
    settingsApplying: 'settingsApplying',
}

export const settingsKeys = {
    editorPath: 'defold.general.editorPath',
    suggestSetup: 'defold.general.suggestSetup',
    showBobOutput: 'defold.general.showBobOutput',
    annotationsRepository: 'defold.annotations.repository',
    dependenciesEmail: 'defold.dependencies.email',
    dependenciesAuthToken: 'defold.dependencies.authToken',
    iosDebugProvisioningProfile: 'defold.bundle.ios.debug.provisioningProfile',
    iosDebugIdentity: 'defold.bundle.ios.debug.identity',
    iosReleaseProvisioningProfile: 'defold.bundle.ios.release.provisioningProfile',
    iosReleaseIdentity: 'defold.bundle.ios.release.identity',
    androidKeystore: 'defold.bundle.android.keystore',
    androidKeystorePass: 'defold.bundle.android.keystorePass',
    androidKeystoreAlias: 'defold.bundle.android.keystoreAlias'
}

export namespace launch {

    export const terminalName = 'Defold Engine'
    export const projectArg = path.join('build', 'default', 'game.projectc')

    export const configs = {
        [platforms.windows]: {
            buildPlatform: 'x86_64-win32',
            unpackBinPath: path.join('_unpack', 'x86_64-win32', 'bin'),
            executable: 'dmengine.exe',
            requiredFiles: ['wrap_oal.dll', 'OpenAL32.dll']
        },
        [platforms.macos]: {
            buildPlatform: process.arch == 'arm64' ? 'arm64-osx' : 'x86_64-osx',
            unpackBinPath: path.join('_unpack', 'arm64' ? 'arm64-macos' : 'x86_64-macos', 'bin'),
            executable: 'dmengine',
        },
        [platforms.linux]: {
            buildPlatform: 'x86_64-linux',
            unpackBinPath: path.join('_unpack', 'x86_64-linux', 'bin'),
            executable: 'dmengine',
        }
    }
}

export const bundleTargets = {
    iOS: {
        label: '$(device-mobile) iOS',
        platform: 'arm64-ios',
        architectures: 'arm64-ios'
    },
    Android: {
        label: '$(device-mobile) Android',
        platform: 'armv7-android',
        architectures: 'armv7-android,arm64-android'
    },
    Windows: {
        label: '$(device-desktop) Windows',
        platform: 'x86_64-win32',
        architectures: 'x86_64-win32'
    },
    macOS: {
        label: '$(device-desktop) macOS',
        platform: 'x86_64-macos',
        architectures: 'x86_64-macos,arm64-macos'
    },
    Linux: {
        label: '$(device-desktop) Linux',
        platform: 'x86_64-linux',
        architectures: 'x86_64-linux'
    },
    HTML5: {
        label: '$(globe) HTML5',
        platform: 'js-web',
        architectures: 'js-web,wasm-web'
    }
}

export namespace urls {

    const defaultRepositoryKey = 'astrochili/defold-annotations'

    const assets = {
        ['astrochili/defold-annotations']: 'defold_api_${defoldVersion}.zip',
        ['mikatuo/defold-lua-annotations']: 'defold-lua-${defoldVersion}.zip'
    }

    export function fallbackReleaseUrl(repositoryKey: string | undefined): string {
        const repository = repositoryKey ?? defaultRepositoryKey
        return `https://api.github.com/repos/${repository}/releases/latest`
    }

    export function annotationsAsset(defoldVersion: string, repositoryKey: string | undefined): string {
        const repository = repositoryKey ?? defaultRepositoryKey
        const assetTemplate = assets[repository as keyof typeof assets] ?? assets[defaultRepositoryKey]
        const asset = assetTemplate.replaceAll('${defoldVersion}', defoldVersion)
        return `https://github.com/${repository}/releases/download/${defoldVersion}/${asset}`
    }

}

export interface PathsConfig {
    resources: string,
    relativeDebuggerLua: string,
    relativeDebuggerScript: string,
    workspaceStorage: string,
    globalStorage: string,
    defoldApi: string
    libsApi: string
    workspace: string,
    workspaceLaunch: string,
    workspaceRecommendations: string,
    workspaceBuild: string,
    workspaceBuildLauncher: string,
    workspaceLibs: string,
    workspaceGameProject: string
}

function makePathsConfig(globalStoragePath: string, workspaceStoragePath: string): PathsConfig {
    const workspace = workspaceFolder.uri.fsPath
    const resources = context.asAbsolutePath('resources')

    const config: PathsConfig = {
        resources: resources,
        relativeDebuggerLua: path.join('debugger', 'debugger.lua'),
        relativeDebuggerScript: path.join('debugger', 'debugger.script'),

        workspaceStorage: workspaceStoragePath,
        globalStorage: globalStoragePath,

        defoldApi: path.join(globalStoragePath, 'defold_api'),
        libsApi: path.join(workspaceStoragePath, 'libs_api'),

        workspace: workspaceFolder.uri.fsPath,
        workspaceLaunch: path.join(workspace, '.vscode', 'launch.json'),
        workspaceRecommendations: path.join(workspace, '.vscode', 'extensions.json'),
        workspaceBuild: path.join(workspace, 'build'),
        workspaceBuildLauncher: path.join(workspace, 'build', 'launcher'),
        workspaceLibs: path.join(workspace, '.internal', 'lib'),
        workspaceGameProject: path.join(workspace, constants.gameProject),
    }

    return config
}

export interface DefoldConfiguration {
    version: string,
    editorPath: string,
    editorJar: string,
    javaBin: string,
    jarBin: string
}

async function makeDefoldConfig(defoldPath: string): Promise<DefoldConfiguration | undefined> {
    const defoldResourcesPath = utils.isMac ? path.join(defoldPath, 'Contents', 'Resources') : defoldPath
    const defoldConfigPath = path.join(defoldResourcesPath, 'config')

    if (!await utils.isPathExists(defoldConfigPath)) {
        log(`Looks like a wrong path to the Defold Editor, the '${defoldResourcesPath}' file not found`)
        return
    }

    const config = ini.parse(fs.readFileSync(defoldConfigPath, 'utf-8'))

    const jdkPath = path.join(defoldResourcesPath, config.launcher.jdk.replace(
        '\$\{bootstrap.resourcespath\}',
        config.bootstrap.resourcespath
    ))

    const javaBin = path.normalize(config.launcher.java.replace(
        '\$\{launcher.jdk\}',
        jdkPath
    ))

    const jarBin = javaBin.replace(
        `${path.sep}java`,
        `${path.sep}jar`,
    )

    const editorJar = path.join(defoldResourcesPath, config.launcher.jar.replace(
        '\$\{bootstrap.resourcespath\}',
        config.bootstrap.resourcespath
    ).replace(
        '\$\{build.editor_sha1\}',
        config.build.editor_sha1
    ))

    return {
        version: config.build.version,
        editorPath: defoldPath,
        editorJar: editorJar,
        javaBin: javaBin,
        jarBin: jarBin
    }
}

export async function init(
    extensionContext: vscode.ExtensionContext,
    folder: vscode.WorkspaceFolder,
    workspaceStoragePath: string,
    globalStoragePath: string
) {
    context = extensionContext

    extension.id  = context.extension.id
    extension.name = context.extension.packageJSON.name
    extension.displayName = context.extension.packageJSON.displayName

    workspaceFolder = folder
    paths = makePathsConfig(globalStoragePath, workspaceStoragePath)

    const defoldPath = utils.settingsString(settingsKeys.editorPath)

    if (defoldPath) {
        defold = await makeDefoldConfig(defoldPath)
    } else {
        defold = undefined
        log(`No path to Defold Editor found so no need to initialize Defold condiguration`)
    }

    log('Configuration'
        + `\n- config.workspace: '${paths.workspace}'`
        + `\n- config.resources: '${paths.resources}'`
        + `\n- config.workspaceStorage: '${paths.workspaceStorage}'`
        + `\n- config.globalStorage: '${paths.globalStorage}'`
        + `\n- config.defold: '${defold?.editorPath}'`
    )
}

export async function updateDefoldPath(path: string): Promise<DefoldConfiguration | undefined> {
    try {
        await vscode.workspace.getConfiguration().update(settingsKeys.editorPath, path, true)
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update Defold path in settings. See Output for details.`)
        log('Unexpected error during updating the Defold path in global settings')
        log(`${error}`, { openOutput: true })
    }

    defold = await makeDefoldConfig(path)
    log(`The Defold Editor path is updated to '${path}'`)

    return defold
}

export function wasOnceSetup(): boolean {
    return context.workspaceState.get('onceSetup') as boolean ?? false
}

export function didOnceSetup() {
    context.workspaceState.update('onceSetup', true)
}