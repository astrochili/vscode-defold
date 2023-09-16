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

async function runBob(defold: DefoldConfiguration, args: string[]): Promise<boolean> {
    const executable = `"${defold.javaBin}"`
    const bobArgs = [`-cp`, `"${defold.editorJar}"`, `"${config.constants.bobClass}"`].concat(args)

    if (utils.settingsBoolean(config.settingsKeys.showBobOutput)) {
        log(`->`, { openOutput: true })
        log(`-> The Output pane automatically opened by running bob.jar`)
        log(`-> You can turn this off in ${config.extension.displayName} settings.`)
        log(`->`)
    }

    return shell.execute('Bob', executable, bobArgs)
}

export async function cleanBuild(defold: DefoldConfiguration): Promise<boolean> {
    return await runBob(defold, [`distclean`])
}

export async function resolve(
    defold: DefoldConfiguration,
    options?: { email?: string, auth?: string }
): Promise<boolean> {
    let args = new Array<string>

    if (options?.email) {
        args.push(`--email`, options.email)
    }

    if (options?.auth) {
        args.push(`--auth`, options.auth)
    }

    args.push(`resolve`)

    return await runBob(defold, args)
}

export async function build(defold: DefoldConfiguration): Promise<boolean> {
    return await runBob(defold, [`--variant`, `debug`, `build`])
}

interface BundleOptions {
    target: string,
    email?: string,
    auth?: string,
    release: boolean,
    textureCompression: boolean,
    buildReport: boolean,
    debugSymbols: boolean,
    liveUpdate: boolean,
    iosMobileProvisioning?: string,
    iosIdentity?: string,
    androidKeystore?: string,
    androidKeystorePass?: string,
    androidKeystoreAlias?: string,
    androidBundleFormat?: string
}

export async function bundle(defold: DefoldConfiguration, options: BundleOptions): Promise<string | undefined> {
    let args = new Array<string>

    const bundlePath = path.join(config.paths.workspace, `bundle`, options.target)

    await utils.deleteFile(bundlePath)
    await utils.createDirectory(bundlePath)

    const targetInfo = config.bundleTargets[options.target as keyof typeof config.bundleTargets]

    if (!targetInfo) {
        log(`Can't find platform and architectures for target ${options.target}`)
        return
    }

    args.push(`--archive`)
    args.push(`--platform`, targetInfo.platform)
    args.push(`--architectures`, targetInfo.architectures)
    args.push(`--bundle-output`, bundlePath)

    if (options.buildReport) {
        const reportPath = path.join(bundlePath, `build-report.html`)
        args.push(`--build-report-html`, reportPath)
    }

    if (options.email) {
        args.push(`--email`, options.email)
    }

    if (options.auth) {
        args.push(`--auth`, options.auth)
    }

    args.push(`--texture-compression`, options.textureCompression ? 'true' : 'false')
    args.push(`--variant`, options.release ? 'release' : 'debug')

    if (options.liveUpdate) {
        args.push(`--liveupdate`, `yes`)
    }

    if (options.debugSymbols) {
        args.push(`--with-symbols`)
    }

    if (targetInfo == config.bundleTargets.iOS) {
        if (!options.iosMobileProvisioning) {
            vscode.window.showWarningMessage(`Mobile Provisioning Profile for ${options.release ? 'Release' : 'Debug'} variant is required to bundle for iOS. Set up it in ${config.extension.displayName} settings.`)
            log('Bundle cancelled because no iOS Mobile Provisioning Profile')
            return
        }

        args.push(`--mobileprovisioning`, options.iosMobileProvisioning)

        if (!options.iosIdentity) {
            vscode.window.showWarningMessage(`Signing Identity is required to bundle for iOS. Set up it in ${config.extension.displayName} settings.`)
            log('Bundle cancelled because no iOS Signing Identity')
            return
        }

        args.push(`--identity`, options.iosIdentity)
    } else if (targetInfo == config.bundleTargets.Android) {
        if (options.androidKeystore) {
            args.push(`--keystore`, options.androidKeystore)
        }

        if (options.androidKeystorePass) {
            args.push(`--keystore-pass`, options.androidKeystorePass)
        }

        if (options.androidKeystoreAlias) {
            args.push(`--keystore-alias`, options.androidKeystoreAlias)
        }

        if (options.androidBundleFormat) {
            args.push(`--bundle-format`, options.androidBundleFormat)
        }
    }

    args.push(`resolve`, `distclean`, `build`, `bundle`)

    const success = await runBob(defold, args)
    return success ? bundlePath : undefined
}