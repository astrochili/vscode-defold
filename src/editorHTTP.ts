/*!
 * Defold Kit
 * https://github.com/astrochili/vscode-defold
 * Copyright (c) 2026 Roman Silin
 * MIT license
 *
 * The Defold name is a registered trademark of the Defold Foundation.
 * https://defold.com
 */

import axios from 'axios'
import path = require('path')
import stream = require('stream')
import * as config from './config'
import * as utils from './utils'
import log from './logger'

export const minimumConsoleSupportedVersion = '1.13.0'
const serverPortNotFoundMessage = 'Defold Editor HTTP server port is not found. Open this project in Defold Editor first.'
const serverPortInvalidPrefix = 'Defold Editor HTTP server port is invalid:'

export type EditorCommand = 'build' | 'build-html5' | 'clean-build' | 'hot-reload' | 'fetch-libraries'
export type BuildIssueSeverity = 'error' | 'warning' | 'information'

export interface EditorCommandResult {
    status: number,
    body: unknown
}

export interface BuildIssue {
    message: string,
    severity: BuildIssueSeverity,
    resource?: string,
    line?: number,
    column?: number,
}

export interface BuildResult {
    success: boolean,
    issues: BuildIssue[]
}

export function isSuccessStatus(status: number): boolean {
    return status >= 200 && status < 300
}

export async function serverUrl(): Promise<string> {
    const port = await readServerPort()
    return `http://127.0.0.1:${port}`
}

export async function postCommand(command: EditorCommand): Promise<EditorCommandResult> {
    const url = await serverUrl()
    log(`Sending Defold Editor command request: POST ${url}/command/${command}`)
    const response = await axios.post(`${url}/command/${command}`, undefined, {
        timeout: commandRequestTimeout(),
        validateStatus: status => (status >= 200 && status < 300) || (status >= 400 && status < 500)
    })
    log(`Defold Editor command response: '${command}' -> status ${response.status}`)

    return {
        status: response.status,
        body: response.data
    }
}

export async function streamConsole(): Promise<stream.Readable> {
    const url = await serverUrl()
    log(`Opening Defold Editor console stream: GET ${url}/console/stream`)

    try {
        const response = await axios.get<stream.Readable>(`${url}/console/stream`, {
            responseType: 'stream',
            timeout: commandRequestTimeout()
        })
        log(`Defold Editor console stream response status: ${response.status}`)

        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.code == 'ECONNABORTED') {
            throw new Error('Defold Editor console stream request timed out.')
        }

        throw error
    }
}

export function parseBuildResult(body: unknown): BuildResult | undefined {
    if (!body || typeof body != 'object') {
        return undefined
    }

    const result = body as { success?: unknown, issues?: unknown }
    if (typeof result.success != 'boolean' || !Array.isArray(result.issues)) {
        return undefined
    }

    const issues: BuildIssue[] = []

    for (const issue of result.issues) {
        const parsedIssue = parseBuildIssue(issue)
        if (!parsedIssue) {
            return undefined
        }

        issues.push(parsedIssue)
    }

    return {
        success: result.success,
        issues: issues
    }
}

export function errorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            return `Defold Editor HTTP request failed with status ${error.response.status}: ${error.response.statusText}`
        }

        if (isEditorConnectionErrorCode(error.code)) {
            return `Defold Editor HTTP server is not reachable. Make sure the project is open in Defold Editor.`
        }

        if (error.code == 'ECONNABORTED') {
            return `Defold Editor HTTP request timed out.`
        }
    }

    if (error instanceof Error) {
        return error.message
    }

    return `${error}`
}

export function isEditorNotOpenError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
        return isEditorConnectionErrorCode(error.code)
    }

    return error instanceof Error
        && (error.message == serverPortNotFoundMessage || error.message.startsWith(serverPortInvalidPrefix))
}

function commandRequestTimeout(): number {
    const timeout = utils.settingsNumber(config.settingsKeys.defoldEditorCommandTimeout)
    return (timeout ?? 60) * 1000
}

function isEditorConnectionErrorCode(code: string | undefined): boolean {
    return code == 'ECONNREFUSED' || code == 'ECONNRESET'
}

function parseBuildIssue(body: unknown): BuildIssue | undefined {
    if (!body || typeof body != 'object') {
        return undefined
    }

    const issue = body as { message?: unknown, severity?: unknown, resource?: unknown, range?: unknown }
    if (typeof issue.message != 'string') {
        return undefined
    }

    if (!isBuildIssueSeverity(issue.severity)) {
        return undefined
    }

    if (issue.resource != undefined && issue.resource != null && typeof issue.resource != 'string') {
        return undefined
    }

    const start = (issue.range as { start?: { line?: unknown, character?: unknown } } | undefined)?.start

    return {
        message: issue.message,
        severity: issue.severity,
        resource: issue.resource ?? undefined,
        line: typeof start?.line == 'number' ? start.line : undefined,
        column: typeof start?.character == 'number' ? start.character : undefined
    }
}

function isBuildIssueSeverity(value: unknown): value is BuildIssueSeverity {
    return value == 'error' || value == 'warning' || value == 'information'
}

async function readServerPort(): Promise<number> {
    const portPath = path.join(config.paths.workspace, '.internal', 'editor.port')

    if (!await utils.isPathExists(portPath)) {
        throw new Error(serverPortNotFoundMessage)
    }

    const rawPort = await utils.readTextFile(portPath)
    if (!rawPort) {
        throw new Error(serverPortNotFoundMessage)
    }

    const port = Number(rawPort.trim())
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`${serverPortInvalidPrefix} '${rawPort.trim()}'.`)
    }

    return port
}
