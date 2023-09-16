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
import * as shell from './shell'
import log from './logger'
import path = require('path')

export async function deploy(target: string): Promise<boolean> {
    const bundlePath = path.join('bundle', target)

    let bundleExtension: string
    let deployExecutable: string

    switch (target) {
        case 'iOS':
            bundleExtension = 'ipa'
            deployExecutable = 'ios-deploy -b'
            break

        case 'Android':
            bundleExtension = 'apk'
            deployExecutable = 'adb install'
            break

        default:
            vscode.window.showWarningMessage(`Unknown target OS for deploying: ${target}`)
            log(`Unknown target OS for deploying: ${target}`)
            return false
    }

    const searchPattern = `${bundlePath}${path.sep}**${path.sep}*.${bundleExtension}`
    let files: vscode.Uri[]

    try {
        files = await vscode.workspace.findFiles(searchPattern)
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to deploy. See Output for details.`)
        log(`Failed to find the bundle with pattern: ${searchPattern}`)
        log(`${error}`)
        return false
    }

    if (files.length == 0) {
        vscode.window.showWarningMessage(`Failed to deploy, prepare the bundle first. The '${searchPattern}' file not found.`)
        log(`Failed to find the bundle with pattern: ${searchPattern}`)
        return false
    }

    const bundleFile = files[0].fsPath

    return shell.execute('Deploy', deployExecutable, [`"${bundleFile}"`])
}