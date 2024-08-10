import * as config from './config'
import * as vscode from 'vscode'

export const keys = {
    dontSuggestSetup: 'dontSuggestSetup',
    bundleTarget: 'bundleTarget',
    bundleOption: 'bundleOption',
    extensionInstallation: 'extensionInstallation',
    settingsApplying: 'settingsApplying',
    lastMigrationVersion: 'lastMigrationVersion',
    annotationsVersion: 'annotationsVersion',
    onceSetup: 'onceSetup',
    libsFolderHash: 'libsFolderHash'
}

export async function savePickerSelection(
    items: vscode.QuickPickItem[],
    picked: vscode.QuickPickItem[],
    memento: vscode.Memento,
    momentoKey: string,
) {
    for (const item of items) {
        await memento.update(`${momentoKey}:${item.label}`, picked.includes(item))
    }
}

export function loadPickerSelection(items: vscode.QuickPickItem[], memento: vscode.Memento, momentoKey: string) {
    for (const item of items) {
        const picked = memento.get(`${momentoKey}:${item.label}`) as boolean
        item.picked = picked == undefined ? item.picked : picked
    }
}

export function getLastGlobalMigrationVersion(): string {
    return config.context.globalState.get(keys.lastMigrationVersion) as string ?? config.lastVersionWithoutMigrationTracking
}

export async function setLastGlobalMigrationVersion(version: string) {
    await config.context.globalState.update(keys.lastMigrationVersion, version)
}

export function getLastWorkspaceMigrationVersion(): string {
    return config.context.workspaceState.get(keys.lastMigrationVersion) as string ?? config.lastVersionWithoutMigrationTracking
}

export async function setLastWorkspaceMigrationVersion(version: string) {
    await config.context.workspaceState.update(keys.lastMigrationVersion, version)
}

export function getAnnotationsVersion(): string|undefined {
    return config.context.globalState.get(keys.annotationsVersion) as string
}

export async function setAnnotationsVersion(version: string) {
    await config.context.globalState.update(keys.annotationsVersion, version)
}

export function getOnceSetup(): boolean {
    return config.context.workspaceState.get(keys.onceSetup) as boolean ?? false
}

export async function setOnceSetup(value: boolean) {
    await config.context.workspaceState.update(keys.onceSetup, value)
}

export function getLibsFolderHash(): number|undefined {
    return config.context.globalState.get(keys.libsFolderHash) as number
}

export async function setLibsFolderHash(hash: number) {
    await config.context.globalState.update(keys.libsFolderHash, hash)
}
