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
import path = require('path')
import * as config from './config'
import * as editorHTTP from './editorHTTP'
import * as utils from './utils'
import log from './logger'

const debounceTimeout = 500

const supportedExtensions = new Set([
    'animationset',
    'appmanifest',
    'atlas',
    'buffer',
    'camera',
    'collection',
    'collectionfactory',
    'collectionproxy',
    'collisionobject',
    'compute',
    'convexshape',
    'cubemap',
    'data',
    'display_profiles',
    'factory',
    'font',
    'fp',
    'gamepads',
    'glb',
    'gltf',
    'go',
    'gui',
    'gui_script',
    'html',
    'input_binding',
    'jpg',
    'jpeg',
    'json',
    'label',
    'lua',
    'material',
    'mesh',
    'model',
    'ogg',
    'opus',
    'otf',
    'particlefx',
    'png',
    'project',
    'properties',
    'render',
    'render_script',
    'render_target',
    'script',
    'settings',
    'sound',
    'sprite',
    'texture_profiles',
    'tilegrid',
    'tilemap',
    'tileset',
    'tilesource',
    'ttf',
    'vp',
    'wav'
])

let debounceTimer: ReturnType<typeof setTimeout> | undefined
let isRunning = false
let pendingRun = false
const pendingFiles = new Set<string>()

export function register(context: vscode.ExtensionContext) {
    const resourceWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(config.workspaceFolder, '**/*'))

    context.subscriptions.push(resourceWatcher)
    context.subscriptions.push(resourceWatcher.onDidCreate(onDidChangeResourceFile))
    context.subscriptions.push(resourceWatcher.onDidChange(onDidChangeResourceFile))
    context.subscriptions.push({
        dispose: () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer)
                debounceTimer = undefined
            }

            pendingFiles.clear()
            pendingRun = false
        }
    })
    log('Defold Editor Hot Reload on Change listeners are registered.')
}

function onDidChangeResourceFile(uri: vscode.Uri) {
    queueHotReload(uri)
}

function queueHotReload(uri: vscode.Uri) {
    if (!utils.settingsBoolean(config.settingsKeys.defoldEditorHotReloadOnChange)) {
        return
    }

    if (uri.scheme != 'file') {
        return
    }

    const workspaceRelativePath = workspaceRelativeFilePath(uri)
    if (!workspaceRelativePath) {
        return
    }

    if (!isSupportedExtension(uri.fsPath)) {
        return
    }

    pendingFiles.add(workspaceRelativePath)
    scheduleHotReload()
}

function scheduleHotReload() {
    if (debounceTimer) {
        clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
        debounceTimer = undefined
        void runHotReloadQueue()
    }, debounceTimeout)
}

async function runHotReloadQueue() {
    if (isRunning) {
        pendingRun = true
        return
    }

    if (pendingFiles.size == 0) {
        return
    }

    const files = Array.from(pendingFiles)
    pendingFiles.clear()
    pendingRun = false
    isRunning = true

    try {
        log(`Defold Editor Hot Reload on Change started for ${files.length} file(s): ${files.join(', ')}`)
        const result = await editorHTTP.postCommand('hot-reload')

        if (result.status == 403) {
            log('Defold Editor Hot Reload on Change skipped: no hot reload target is available (status 403).')
        } else if (!editorHTTP.isSuccessStatus(result.status)) {
            log(`Defold Editor Hot Reload on Change failed with status ${result.status}.`)
        }
    } catch (error) {
        log(`Defold Editor Hot Reload on Change failed: ${editorHTTP.errorMessage(error)}`)
    } finally {
        isRunning = false

        if (pendingRun || pendingFiles.size > 0) {
            scheduleHotReload()
        }
    }
}

function workspaceRelativeFilePath(uri: vscode.Uri): string | undefined {
    const fileWorkspaceFolder = vscode.workspace.getWorkspaceFolder(uri)
    if (fileWorkspaceFolder?.uri.fsPath != config.paths.workspace) {
        return undefined
    }

    const relativePath = path.relative(config.paths.workspace, uri.fsPath)
    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return undefined
    }

    return relativePath
}

function isSupportedExtension(filePath: string): boolean {
    const extension = path.extname(filePath).slice(1).toLowerCase()
    return supportedExtensions.has(extension)
}
