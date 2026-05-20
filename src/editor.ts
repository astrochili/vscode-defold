/*!
 * Defold Kit
 * https://github.com/astrochili/vscode-defold
 * Copyright (c) 2026 Roman Silin
 * MIT license
 *
 * The Defold name is a registered trademark of the Defold Foundation.
 * https://defold.com
 */

import * as vscode from 'vscode'
import * as config from './config'
import * as editorHTTP from './editorHTTP'
import * as editorConsole from './editorConsole'
import * as utils from './utils'
import log from './logger'

export interface RunEditorCommandOptions {
    title: string,
    openConsoleBeforeRun?: boolean,
    connectConsoleAfterRun?: boolean
}

export async function showConsole(defold: config.DefoldConfiguration) {
    try {
        if (utils.compareVersions(defold.version, editorHTTP.minimumConsoleSupportedVersion) < 0) {
            throw new Error(`Defold Editor console requires Defold Editor ${editorHTTP.minimumConsoleSupportedVersion} or newer. Current version: ${defold.version}.`)
        }

        await editorHTTP.serverUrl()
        log('Opening Defold Editor console.')
        await editorConsole.show('connect')
    } catch (error) {
        log(`Defold Editor console request failed: ${editorHTTP.errorMessage(error)}`)
        showEditorError(error)
    }
}

export async function runCommand(
    command: editorHTTP.EditorCommand,
    options: RunEditorCommandOptions
) {
    const useConsole = options.openConsoleBeforeRun == true
    let canWriteConsole = false

    try {
        log(`Defold Editor command started: '${command}' (openConsoleBeforeRun=${useConsole}, connectConsoleAfterRun=${options.connectConsoleAfterRun == true})`)
        await editorHTTP.serverUrl()

        if (useConsole) {
            log(`Opening Defold Editor console before ${editorCommandLabel(command)}.`)
            await editorConsole.show('openOnly', {
                clear: true
            })
            canWriteConsole = true
        }

        const result = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: options.title
        }, async () => {
            return await editorHTTP.postCommand(command)
        })
        log(`Defold Editor command completed: '${command}' returned status ${result.status}.`)

        switch (command) {
            case 'build':
            case 'clean-build':
                handleEditorBuildResult(command, result)
                break
            case 'build-html5':
            case 'fetch-libraries':
                handleEditorCommandStatusResult(command, result)
                break
            case 'hot-reload':
                if (result.status == 403) {
                    vscode.window.showWarningMessage('No target is available for Hot Reload.')
                    log('Defold Editor Hot Reload is not available: status 403.')
                    break
                }

                handleEditorCommandStatusResult(command, result)
                break
        }

        const shouldConnectConsoleAfterRun = options.connectConsoleAfterRun == true
            && ((command != 'build' && command != 'clean-build') || editorHTTP.parseBuildResult(result.body)?.success == true)

        if (shouldConnectConsoleAfterRun) {
            log(`Connecting Defold Editor console after ${editorCommandLabel(command)}.`)
            await editorConsole.show('openOnly')
            await editorConsole.show('connectInBackground', {
                onBackgroundError: showEditorError
            })
        }
    } catch (error) {
        log(`Defold Editor command failed: '${command}' -> ${editorHTTP.errorMessage(error)}`)
        if (canWriteConsole && !editorHTTP.isEditorNotOpenError(error)) {
            writeEditorCommandErrorLine(command, editorHTTP.errorMessage(error))
            return
        }

        if (editorHTTP.isEditorNotOpenError(error)) {
            showEditorError(error)
            return
        }

        showEditorCommandError(command, editorHTTP.errorMessage(error))
    }
}

function handleEditorBuildResult(command: 'build' | 'clean-build', result: editorHTTP.EditorCommandResult) {
    const buildResult = editorHTTP.parseBuildResult(result.body)
    const commandLabel = editorCommandLabel(command)

    if (result.status == 200 || result.status == 422) {
        if (!buildResult) {
            log(`${commandLabel} returned an unparseable body for status ${result.status}.`)
            throw new Error(`${commandLabel} returned an unexpected response.`)
        }

        const relevantIssues = buildResult.issues.filter(issue => issue.severity == 'error' || issue.severity == 'warning')

        if (!buildResult.success) {
            editorConsole.appendError(`${commandLabel} failed.`)
            log(`${commandLabel} failed.`)
        } else if (relevantIssues.some(issue => issue.severity == 'warning')) {
            editorConsole.appendWarning(`${commandLabel} completed with warnings.`)
            log(`${commandLabel} completed with warnings.`)
        }

        for (const issue of relevantIssues) {
            let line = issue.message

            if (issue.resource) {
                if (issue.line == undefined || issue.column == undefined) {
                    line = `${issue.resource}: ${issue.message}`
                } else {
                    line = `${issue.resource}:${issue.line + 1}:${issue.column + 1}: ${issue.message}`
                }
            }

            if (issue.severity == 'error') {
                editorConsole.appendError(line)
            } else {
                editorConsole.appendWarning(line)
            }

            log(`${commandLabel} issue [${issue.severity}]: ${line}`)
        }

        log(`${commandLabel} ${buildResult.success ? 'completed' : 'failed'} with ${relevantIssues.length} warning/error issue(s).`)
        return
    }

    if (editorHTTP.isSuccessStatus(result.status)) {
        log(`${commandLabel} returned unexpected success status ${result.status}.`)
        throw new Error(`${commandLabel} returned an unexpected status ${result.status}.`)
    }

    writeEditorCommandErrorLine(command, `failed with status ${result.status}.`)
}

function handleEditorCommandStatusResult(command: editorHTTP.EditorCommand, result: editorHTTP.EditorCommandResult) {
    if (editorHTTP.isSuccessStatus(result.status)) {
        return
    }

    const commandLabel = editorCommandLabel(command)

    if (result.status == 403) {
        vscode.window.showWarningMessage(`${commandLabel} is not available in the current Defold Editor state.`)
        log(`${commandLabel} is not available: status 403.`)
        return
    }

    showEditorCommandError(command, `failed with status ${result.status}.`)
}

function writeEditorCommandErrorLine(command: editorHTTP.EditorCommand, message: string) {
    const line = `${editorCommandLabel(command)} ${message}`
    editorConsole.appendError(line)
    log(line)
}

function showEditorCommandError(command: editorHTTP.EditorCommand, message: string) {
    const commandLabel = editorCommandLabel(command)
    vscode.window.showErrorMessage(`${commandLabel} failed. See Output for details.`)
    log(`${commandLabel} ${message}`)
}

function editorCommandLabel(command: editorHTTP.EditorCommand): string {
    switch (command) {
        case 'build':
            return 'Defold Editor Build'
        case 'build-html5':
            return 'Defold Editor Build HTML5'
        case 'clean-build':
            return 'Defold Editor Clean Build'
        case 'hot-reload':
            return 'Defold Editor Hot Reload'
        case 'fetch-libraries':
            return 'Defold Editor Fetch Libraries'
    }
}

function showEditorError(error: unknown) {
    const message = editorHTTP.errorMessage(error)
    const openDefold = 'Open Defold'

    if (editorHTTP.isEditorNotOpenError(error)) {
        vscode.window.showErrorMessage(message, openDefold).then(action => {
            if (action == openDefold) {
                void vscode.commands.executeCommand(`${config.extension.commandPrefix}.openDefold`)
            }
        })
    } else {
        vscode.window.showErrorMessage(message)
    }

    log(`Defold Editor HTTP error: ${message}`)
}
