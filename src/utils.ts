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
import log from './logger'

export const isMac = process.platform == 'darwin'
export const isWindows = process.platform == 'win32'
export const isLinux = process.platform == 'linux'

export function compareVersions(a: string, b: string): number {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base'
    })
}

export function settingsString(key: string): string | undefined {
    return vscode.workspace.getConfiguration().get<string>(key)
}

export function settingsBoolean(key: string): boolean | undefined {
    return vscode.workspace.getConfiguration().get<boolean>(key)
}

export async function isPathExists(path: string): Promise<boolean> {
    const uri = vscode.Uri.file(path)

    try {
        await vscode.workspace.fs.stat(uri)
        return true
    } catch (error) {
        return false
    }
}

export async function readDirectory(path: string): Promise<[string, vscode.FileType][] | undefined> {
    try {
        const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(path))
        return files
    } catch (error) {
        log(`Exception occured during reading directory: ${error}`)
        return undefined
    }
}

export async function createDirectory(path: string): Promise<boolean> {
    try {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(path))
        return true
    } catch (error) {
        log(`Exception occured during creating directory: ${error}`)
        return false
    }
}

export async function readFile(path: string): Promise<Uint8Array | undefined> {
    try {
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(path))
        return content
    } catch (error) {
        log(`Exception occured during reading file: ${error}`)
        return undefined
    }
}

export async function writeFile(path: string, data: Uint8Array): Promise<boolean> {
    try {
        await vscode.workspace.fs.writeFile(vscode.Uri.file(path), data)
        return true
    } catch (error) {
        log(`Exception occured during writing file: ${error}`)
        return false
    }
}

export async function deleteFile(path: string): Promise<boolean> {
    try {
        await vscode.workspace.fs.delete(vscode.Uri.file(path), { recursive: true, useTrash: false })
        return true
    } catch (error) {
        log(`Exception occured during deleting file: ${error}`)
        return false
    }
}

export async function copy(path: string, target: string): Promise<boolean> {
    try {
        await vscode.workspace.fs.copy(vscode.Uri.file(path), vscode.Uri.file(target), { overwrite: true })
        return true
    } catch (error) {
        log(`Exception occured during copying file: ${error}`)
        return false
    }
}