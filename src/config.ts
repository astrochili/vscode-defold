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

export const lastVersionWithoutMigrationTracking = "2.0.5"

export namespace extension {

    export let id: string
    export let version: string
    export let displayName: string
    export let commandPrefix: string
    export let taskPrefix: string

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


export const defoldProcess = {
    [platforms.windows]: 'Defold.exe',
    [platforms.macos]: 'Defold',
    [platforms.linux]: 'Defold'
}[process.platform]

export const constants = {
    homedirShortcut: '~',
    gameProject: 'game.project',
    bobClass: 'com.dynamo.bob.Bob',
    sumnekoSettingsLibraryKey: 'Lua.workspace.library',
    androidBundleFormats: 'aab,apk'
}

export const settingsKeys = {
    editorPath: 'defoldKit.general.editorPath',
    suggestSetup: 'defoldKit.general.suggestSetup',
    showBobOutput: 'defoldKit.general.showBobOutput',
    annotationsRepository: 'defoldKit.annotations.repository',
    dependenciesEmail: 'defoldKit.dependencies.email',
    dependenciesAuthToken: 'defoldKit.dependencies.authToken',
    iosDebugProvisioningProfile: 'defoldKit.bundle.ios.debug.provisioningProfile',
    iosDebugIdentity: 'defoldKit.bundle.ios.debug.identity',
    iosReleaseProvisioningProfile: 'defoldKit.bundle.ios.release.provisioningProfile',
    iosReleaseIdentity: 'defoldKit.bundle.ios.release.identity',
    androidKeystore: 'defoldKit.bundle.android.keystore',
    androidKeystorePass: 'defoldKit.bundle.android.keystorePass',
    androidKeystoreAlias: 'defoldKit.bundle.android.keystoreAlias'
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
            unpackBinPath: path.join('_unpack', process.arch == 'arm64' ? 'arm64-macos' : 'x86_64-macos', 'bin'),
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
        ['astrochili/defold-annotations']: 'releases/download/${tag}/defold_api_${tag}.zip',
        ['mikatuo/defold-lua-annotations']: 'releases/download/${tag}/defold-lua-${tag}.zip',
        ['d954mas/defold-api-emmylua']: 'releases/download/${tag}/defold_api.zip'
    }

    export function fallbackReleaseUrl(repositoryKey: string | undefined): string {
        const repository = repositoryKey ?? defaultRepositoryKey
        return `https://api.github.com/repos/${repository}/releases/latest`
    }

    export function annotationsAsset(tag: string, repositoryKey: string | undefined): string {
        const repository = repositoryKey ?? defaultRepositoryKey
        const assetTemplate = assets[repository as keyof typeof assets] ?? assets[defaultRepositoryKey]
        const asset = assetTemplate.replaceAll('${tag}', tag)

        return `https://github.com/${repository}/${asset}`
    }

}

export interface PathsConfig {
    resources: string,
    relativeDebuggerLua: string,
    relativeDebuggerScript: string,
    relativeBuildLauncher: string,
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
    const relativeBuildLauncher = path.join('build', 'defoldkit')

    const config: PathsConfig = {
        resources: resources,
        relativeDebuggerLua: path.join('debugger', 'debugger.lua'),
        relativeDebuggerScript: path.join('debugger', 'debugger.script'),
        relativeBuildLauncher: relativeBuildLauncher,

        workspaceStorage: workspaceStoragePath,
        globalStorage: globalStoragePath,

        // Uses `defold_api` folder to avoid direct autocompletion in the require function
        defoldApi: path.join(globalStoragePath, 'defold_api'),
        libsApi: path.join(workspaceStoragePath, 'libs_api'),

        workspace: workspaceFolder.uri.fsPath,
        workspaceLaunch: path.join(workspace, '.vscode', 'launch.json'),
        workspaceRecommendations: path.join(workspace, '.vscode', 'extensions.json'),
        workspaceBuild: path.join(workspace, 'build'),
        workspaceBuildLauncher: path.join(workspace, relativeBuildLauncher),
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

    const rawConfig = await utils.readTextFile(defoldConfigPath)

    if (!rawConfig) {
        vscode.window.showErrorMessage(`Failed to read Defold Editor config file. See Output for details.`)
        return
    }

    const config = ini.parse(rawConfig)

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
    extension.version  = context.extension.packageJSON.version
    extension.displayName = context.extension.packageJSON.displayName
    extension.commandPrefix = context.extension.packageJSON.contributesPrefix
    extension.taskPrefix = context.extension.packageJSON.contributesPrefix

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