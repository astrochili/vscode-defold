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
import { DefoldConfiguration } from './config'
import * as utils from './utils'
import * as shell from './shell'
import log from './logger'
import path = require('path')

async function extractFromDefold(defold: DefoldConfiguration, internalPath: string, destinationPath: string): Promise<boolean> {
    const tempPath = path.join(config.paths.workspaceStorage, 'tmp')

    log(`Creating temporary directory: ${tempPath}`)
    if (!await utils.createDirectory(tempPath)) {
        vscode.window.showErrorMessage(`Failed preparing to launch. See Output for details.`)
        return false
    }

    const result = await shell.execute(
        `Jar Extracting`,
        `"${defold.jarBin}"`,
        [`-xf`, `"${defold.editorJar}"`, `"${internalPath}"`],
        tempPath
    )

    if (!result.success) {
        vscode.window.showErrorMessage(`Failed preparing to launch. See Output for details.`)
        return false
    }

    log(`Copying '${internalPath}' to '${destinationPath}'`)
    const isCopied = await utils.copy(path.join(tempPath, internalPath), destinationPath)

    if (!isCopied) {
        vscode.window.showErrorMessage(`Failed preparing to launch. See Output for details.`)
        return false
    }

    log(`Deleting temporary directory: ${tempPath}`)
    await utils.deleteFile(tempPath)

    return true
}

export async function prepare(defold: DefoldConfiguration): Promise<boolean> {
    const launchConfig = config.launch.configs[process.platform]

    if (!launchConfig) {
        vscode.window.showErrorMessage(`Failed preparing to launch. See Output for details.`)
        log(`Failed to get launch configuration for the unknown platform ${process.platform}`)
        return false
    }

    const buildPlatform = launchConfig.buildPlatform
    const engineExecutable = launchConfig.executable
    const libexecBinPath = launchConfig.libexecBinPath

    log(`Process platform: '${process.platform}'`)
    log(`Build platform: '${buildPlatform}'`)

    const buildPlatformPath = path.join(config.paths.workspaceBuild, buildPlatform)
    const enginePlatformPath = path.join(buildPlatformPath, engineExecutable)

    const engineLauncherPath = path.join(config.paths.workspaceBuildLauncher, engineExecutable)

    const isEngineHere = await utils.isPathExists(enginePlatformPath)

    if (isEngineHere) {
        log(`Native engine found. Copying the engine from '${enginePlatformPath}' to '${engineLauncherPath}'`)
        const isCopied = await utils.copy(enginePlatformPath, engineLauncherPath)

        if (!isCopied) {
            vscode.window.showErrorMessage(`Failed preparing to launch. See Output for details.`)
            log(`Failed to copy the engine executable from the build`)
            return false
        }
    } else {
        log(`Extracting the vanilla engine from Defold to '${engineLauncherPath}'`)
        const isExctracted = await extractFromDefold(
            defold,
            path.join(libexecBinPath, engineExecutable),
            engineLauncherPath
        )

        if (!isExctracted) {
            vscode.window.showErrorMessage(`Failed preparing to launch. See Output for details.`)
            log(`Failed to extract the engine executable from Defold'`)
            return false
        }
    }

    if (launchConfig.requiredFiles) {
        for (const requiredFile of launchConfig.requiredFiles) {
            const destinationPath = path.join(config.paths.workspaceBuildLauncher, requiredFile)

            if (await utils.isPathExists(destinationPath)) {
                log(`No need to extract '${requiredFile}', already have`)
            } else {
                log(`Extracting required '${requiredFile}' from Defold`)
                const isExctracted = await extractFromDefold(
                    defold,
                    path.join(libexecBinPath, requiredFile),
                    destinationPath,
                )

                if (!isExctracted) {
                    vscode.window.showErrorMessage(`Failed preparing to launch. See Output for details.`)
                    log(`Failed to extract '${requiredFile}' from Defold`)
                    return false
                }
            }
        }
    }

    if (utils.isMac || utils.isLinux) {
        log(`Unix: Make the engine executable`)
        const result = await shell.execute(
            'Chmod',
            'chmod',
            [`+x`, `"${engineLauncherPath}"`]
        )

        if (!result.success) {
            vscode.window.showErrorMessage(`Failed preparing to launch. See Output for details.`)
            log(`Failed to make the engine executable`)
            return false
        }
    }

    return true
}

export async function openDefold(defold: DefoldConfiguration) {
    let result

    if (utils.isWindows) {
        result = await shell.execute('Defold', `"${config.paths.workspaceGameProject}"`)
    } else if (utils.isMac) {
        if (await utils.isProcessRunning(config.defoldProcess)) {
            result = await shell.execute('Defold', 'osascript', ['-e', `'activate application "Defold"'`])
        } else {
            result = await shell.execute('Defold', 'open', [`'${defold.editorPath}'`, `'${config.paths.workspaceGameProject}'`])
        }
    } else if (utils.isLinux) {
        result = await shell.execute('Defold', 'xdg-open', [`"${config.paths.workspaceGameProject}"`])
    } else {
        log(`Unable to open Defold Editor due to unknown platform: ${process.platform}`)
    }

    if (!result || !result.success) {
        vscode.window.showErrorMessage(`Failed to open Defold Editor. See Output for details.`)
    }
}