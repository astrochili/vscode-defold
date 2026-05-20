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
import fs = require('fs')
import path = require('path')
import stream = require('stream')
import * as config from './config'
import * as editorHTTP from './editorHTTP'
import log from './logger'

const terminalName = 'Defold Editor: Console'
const terminalResetColor = '\x1b[0m'
const terminalClearMarker = '\x1b[3J\x1b[H\x1b[2J'
const reloadSuccessfulPattern = /^INFO:RESOURCE: .+? was successfully reloaded\.$/

type ShowMode = 'connect' | 'connectInBackground' | 'openOnly'

interface ShowOptions {
    clear?: boolean,
    onBackgroundError?: (error: unknown) => void
}

interface ConsoleLocation {
    path: string,
    line?: number,
    column?: number
}

let terminal: EditorConsoleTerminal | undefined

export function register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.window.registerTerminalLinkProvider(new EditorConsoleLinkProvider()))
}

export async function show(mode: ShowMode = 'connect', options: ShowOptions = {}) {
    if (!terminal) {
        terminal = new EditorConsoleTerminal()
    }

    await terminal.show(mode, options)
}

export function appendWarning(line: string) {
    terminal?.appendColoredLine(line, '\x1b[33m')
}

export function appendError(line: string) {
    terminal?.appendColoredLine(line, '\x1b[31m')
}

class EditorConsoleTerminal {
    private writeEmitter = new vscode.EventEmitter<string>()
    private closeEmitter = new vscode.EventEmitter<void>()
    private terminal: vscode.Terminal | undefined
    private consoleStream: stream.Readable | undefined
    private connectPromise: Promise<void> | undefined
    private pendingWrites: string[] = []
    private lineBuffer = ''
    private isOpen = false
    private isDisconnecting = false

    readonly pty: vscode.Pseudoterminal = {
        onDidWrite: this.writeEmitter.event,
        onDidClose: this.closeEmitter.event,
        open: () => {
            this.isOpen = true

            for (const data of this.pendingWrites) {
                this.writeEmitter.fire(data)
            }

            this.pendingWrites = []
        },
        close: () => {
            this.isOpen = false
            this.stopStream(true)
            this.terminal = undefined
            this.resetOutputState()
            this.isDisconnecting = false
        }
    }

    async show(mode: ShowMode, options: ShowOptions = {}) {
        log(`Defold Editor console show requested: mode '${mode}'.`)
        if (!this.terminal) {
            log('Creating Defold Editor console terminal.')
            this.terminal = vscode.window.createTerminal({
                name: terminalName,
                pty: this.pty,
                isTransient: true
            })
        }
        this.terminal?.show()

        if (mode == 'openOnly') {
            this.stopStream(true)
        }

        if (options.clear) {
            this.clearOutput(true)
        }

        if (mode == 'openOnly') {
            return
        }

        if (mode == 'connectInBackground') {
            void this.ensureConnected().catch(error => {
                log(`Defold Editor console failed to connect: ${editorHTTP.errorMessage(error)}`)
                options.onBackgroundError?.(error)
            })
            return
        }

        await this.ensureConnected()
    }

    private async ensureConnected() {
        if (this.consoleStream) {
            return
        }

        if (!this.connectPromise) {
            this.connectPromise = this.connect()
        }

        try {
            await this.connectPromise
        } finally {
            this.connectPromise = undefined
        }
    }

    private async connect() {
        log('Connecting to Defold Editor console stream.')
        const consoleStream = await editorHTTP.streamConsole()

        if (!this.terminal) {
            consoleStream.destroy()
            return
        }

        this.isDisconnecting = false
        this.consoleStream = consoleStream
        log('Connected to Defold Editor console stream.')
        consoleStream.on('data', (data: Buffer | string) => {
            this.appendChunk(data.toString())
        })
        consoleStream.on('error', error => {
            this.disconnect(error)
        })
        consoleStream.on('end', () => {
            this.disconnect(new Error('Defold Editor console stream ended.'))
        })
    }

    private stopStream(silent = false) {
        if (silent) {
            this.consoleStream?.removeAllListeners()
        }

        this.consoleStream?.destroy()
        this.consoleStream = undefined
    }

    private disconnect(error: unknown) {
        if (!this.terminal) {
            return
        }

        if (this.isDisconnecting) {
            return
        }

        this.isDisconnecting = true
        log(`Defold Editor console disconnected: ${editorHTTP.errorMessage(error)}`)
        this.stopStream()
        this.isOpen = false
        this.resetOutputState()
        this.closeEmitter.fire()
    }

    private appendChunk(chunk: string) {
        const normalizedChunk = chunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        const buffer = this.lineBuffer + normalizedChunk
        const lines = buffer.split('\n')
        this.lineBuffer = lines.pop() ?? ''

        for (const line of lines) {
            const outputLine = line.includes(terminalClearMarker)
                ? line.replace(terminalClearMarker, '')
                : line

            if (line.includes(terminalClearMarker)) {
                this.clearOutput()
            }

            if (outputLine.length > 0) {
                this.writeTerminal(`${formatLine(outputLine)}\r\n`)
            }
        }
    }

    appendColoredLine(line: string, color: string) {
        this.writeTerminal(`${color}${line}${terminalResetColor}\r\n`)
    }

    private clearOutput(resetLineBuffer = false) {
        if (resetLineBuffer) {
            this.lineBuffer = ''
        }

        if (this.isOpen) {
            this.writeEmitter.fire('\x1b[2J\x1b[3J\x1b[H')
        }

        this.pendingWrites = []
    }

    private resetOutputState() {
        this.lineBuffer = ''
        this.pendingWrites = []
    }

    private writeTerminal(data: string) {
        if (this.isOpen) {
            this.writeEmitter.fire(data)
        } else {
            this.pendingWrites.push(data)
        }
    }
}

class EditorConsoleLink extends vscode.TerminalLink {
    constructor(
        startIndex: number,
        length: number,
        readonly location: ConsoleLocation
    ) {
        super(startIndex, length, 'Open file')
    }
}

class EditorConsoleLinkProvider implements vscode.TerminalLinkProvider<EditorConsoleLink> {
    provideTerminalLinks(context: vscode.TerminalLinkContext): vscode.ProviderResult<EditorConsoleLink[]> {
        if (context.terminal.name != terminalName) {
            return []
        }

        const links: EditorConsoleLink[] = []
        const pattern = /((?:\/[^\s:]+|[A-Za-z]:\\[^\s:]+|[\w.-]+(?:\/[\w.-]+)+))(?::(\d+))?(?::(\d+))?/g
        let match: RegExpExecArray | null

        while ((match = pattern.exec(context.line))) {
            const location = normalizeLocation(match[1], match[2], match[3])
            if (location) {
                links.push(new EditorConsoleLink(match.index, match[0].length, location))
            }
        }

        return links
    }

    async handleTerminalLink(link: EditorConsoleLink): Promise<void> {
        const uri = vscode.Uri.file(link.location.path)
        const position = new vscode.Position(
            Math.max((link.location.line ?? 1) - 1, 0),
            Math.max((link.location.column ?? 1) - 1, 0)
        )
        const document = await vscode.workspace.openTextDocument(uri)
        const activeEditor = await vscode.window.showTextDocument(document)

        activeEditor.selection = new vscode.Selection(position, position)
        activeEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter)
    }
}

function formatLine(line: string): string {
    if (reloadSuccessfulPattern.test(line)) {
        return `\x1b[32m${line}${terminalResetColor}`
    }

    const severity = lineSeverity(line)
    if (!severity) {
        return line
    }

    if (severity == 'info') {
        return `${severityColor(severity)}${line}${terminalResetColor}`
    }

    const prefixMatch = line.match(/^(?:(?:ERROR|FATAL|WARNING|INFO|DEBUG):)(?:[A-Z0-9_-]+:)*(?=\s)/)
    if (!prefixMatch) {
        return line
    }

    const prefix = prefixMatch[0]
    return `${severityColor(severity)}${prefix}${terminalResetColor}${line.slice(prefix.length)}`
}

function lineSeverity(line: string): 'error' | 'fatal' | 'warning' | 'info' | 'debug' | undefined {
    if (line.startsWith('ERROR:')) {
        return 'error'
    }

    if (line.startsWith('FATAL:')) {
        return 'fatal'
    }

    if (line.startsWith('WARNING:')) {
        return 'warning'
    }

    if (line.startsWith('INFO:')) {
        return 'info'
    }

    if (line.startsWith('DEBUG:')) {
        return 'debug'
    }
}

function severityColor(severity: 'error' | 'fatal' | 'warning' | 'info' | 'debug'): string {
    switch (severity) {
        case 'error':
        case 'fatal':
            return '\x1b[31m'
        case 'warning':
            return '\x1b[33m'
        case 'info':
            return '\x1b[2m'
        case 'debug':
            return '\x1b[34m'
    }
}

function normalizeLocation(rawPath: string, rawLine?: string, rawColumn?: string): ConsoleLocation | undefined {
    const cleanPath = rawPath.replace(/^file:\/\//, '')
    let filePath = path.isAbsolute(cleanPath) ? cleanPath : path.join(config.paths.workspace, cleanPath)

    if (path.isAbsolute(cleanPath) && !isInsideWorkspace(cleanPath)) {
        const resourcePath = path.join(config.paths.workspace, cleanPath.replace(/^[/\\]+/, ''))
        if (fs.existsSync(resourcePath)) {
            filePath = resourcePath
        }
    }

    if (!isInsideWorkspace(filePath)) {
        return undefined
    }

    return {
        path: filePath,
        line: rawLine ? Number(rawLine) : undefined,
        column: rawColumn ? Number(rawColumn) : undefined
    }
}

function isInsideWorkspace(filePath: string): boolean {
    const relativePath = path.relative(config.paths.workspace, filePath)
    return relativePath == '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}
