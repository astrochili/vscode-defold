import * as config from './config'
import * as vscode from 'vscode'

export const keys = {
    dontSuggestSetup: 'dontSuggestSetup',
    bundleTarget: 'bundleTarget',
    bundleOption: 'bundleOption',
    extensionInstallation: 'extensionInstallation',
    settingsApplying: 'settingsApplying',
    lastMigrationVersion: 'lastMigrationVersion',
    onceSetup: 'onceSetup'
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

export function getLastMigrationVersion(): string {
    const lastVersionWithoutTracking = "2.0.5"
    return config.context.globalState.get(keys.lastMigrationVersion) as string ?? lastVersionWithoutTracking
}

export async function setLastMigrationVersion(version: string) {
    await config.context.globalState.update(keys.lastMigrationVersion, version)
}

export function getOnceSetup(): boolean {
    return config.context.workspaceState.get(keys.onceSetup) as boolean ?? false
}

export async function setOnceSetup(value: boolean) {
    await config.context.workspaceState.update(keys.onceSetup, value)
}
