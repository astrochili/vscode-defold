/*!
 * Defold Kit
 * https://github.com/astrochili/vscode-defold
 * Copyright (c) 2023 Roman Silin
 * MIT license
 *
 * The Defold name is a registered trademark of the Defold Foundation.
 * https://defold.com
 */

import * as childProcess from 'child_process'
import * as config from './config'
import log from './logger'

export async function execute(
    label: string,
    executable: string,
    args: string[],
    cwd?: string
): Promise<boolean> {
    const command = `${executable} ${args.join(' ')}`
    log(`${label} $: ${command}`)

    return new Promise<boolean>((resolve) => {
        log(`${label}: [starting]`)
        const child = childProcess.exec(command, {
            cwd: cwd ?? config.paths.workspace
        })

        child.stdout?.on('data', data => {
            const message = data.trim()

            if (message) {
                log(`${label}: [stdout] ${message}`)
            }
        })

        child.stderr?.on('data', data => {
            log(`${label}: [stderr] ${data.trim()}`)
        })

        child.on('error', error => {
            log(`${label}: [error] ${error.message}`, { openOutput: true })
            return resolve(false)
        })

        child.on('close', code => {
            log(`${label}: [exit ${code}]`, { openOutput: code != 0 })
            return resolve(code == 0)
        })
    })
}