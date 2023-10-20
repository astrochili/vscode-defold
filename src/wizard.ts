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
import * as JSON5 from 'json5'
import * as config from './config'
import * as momento from './momento'
import * as utils from './utils'
import * as annotations from './annotations'
import * as extensions from './data/extensions'
import * as debuggers from './data/debuggers'
import log from './logger'
import path = require('path')

const decoder = new TextDecoder()
const encoder = new TextEncoder()

async function copyDebuggerResources() {
    const resourcesDebuggerLua = path.join(config.paths.resources, config.paths.relativeDebuggerLua)
    const workspaceDebuggerLua = path.join(config.paths.workspace, config.paths.relativeDebuggerLua)

    if (await utils.isPathExists(workspaceDebuggerLua)) {
        log(`No need to copy '${config.paths.relativeDebuggerLua}', already exists`)
    } else {
        log(`Copying from '${resourcesDebuggerLua}' to '${workspaceDebuggerLua}'`)

        if (!await utils.copy(resourcesDebuggerLua, workspaceDebuggerLua)) {
            vscode.window.showWarningMessage(`Failed to copy '${config.paths.relativeDebuggerLua}' to the workspace. See Output for details.`)
            log(`Failed to copy '${config.paths.relativeDebuggerLua}' to the workspace'`)
        }
    }

    const resourcesDebuggerScript = path.join(config.paths.resources, config.paths.relativeDebuggerScript)
    const workspaceDebuggerScript = path.join(config.paths.workspace, config.paths.relativeDebuggerScript)

    if (await utils.isPathExists(workspaceDebuggerScript)) {
        log(`No need to copy '${config.paths.relativeDebuggerScript}', already exists`)
    } else {
        log(`Copying from '${resourcesDebuggerScript}' to '${workspaceDebuggerScript}'`)

        if (!await utils.copy(resourcesDebuggerScript, workspaceDebuggerScript)) {
            vscode.window.showWarningMessage(`Failed to copy '${config.paths.relativeDebuggerScript}' to the workspace. See Output for details.`)
            log(`Failed to copy '${config.paths.relativeDebuggerScript}' to the workspace'`)
        }
    }
}

async function applyDebugConfiguration(configuration: vscode.DebugConfiguration) {
    const launchSettings = vscode.workspace.getConfiguration('launch')
    let configurations = launchSettings.get('configurations') as vscode.DebugConfiguration[]

    if (configurations.find(existingConfiguration => {
        return existingConfiguration.name == configuration.name && existingConfiguration.type == configuration.type
    })) {
        log(`Launch configuration '${configuration.name}' with type '${configuration.type}' already exists, adding skipped.`)
        return
    }

    configurations.push(configuration)

    await launchSettings.update('configurations', configurations)
}

async function applyDebugConfigurations(extensionIds: string[]) {
    const debuggerIds = Object.keys(debuggers.recommended).filter(extensionId => {
        return extensionIds.includes(extensionId) || vscode.extensions.getExtension(extensionId)
    })

    for (const extensionId of debuggerIds) {
        const configuration = debuggers.recommended[extensionId as keyof typeof debuggers.recommended]

        if (configuration) {
            log(`Found debug configuration for extension: '${extensionId}'`)

            try {
                await applyDebugConfiguration(configuration)
                log(`Applied debug configuration for extension: '${extensionId}'`)
            } catch (error) {
                vscode.window.showWarningMessage(`Failed to apply debug configuration for extension ${extensionId}`)
                log(`Failed to apply debug configuration for extension '${extensionId}'`)
                log(`${error}`)
            }
        }
    }
}

async function updateConfiguration(
    configuration: vscode.WorkspaceConfiguration,
    key: string,
    value: any,
    configurationTarget?: vscode.ConfigurationTarget | boolean | null,
    overrideInLanguage?: boolean
) {
    try {
        await configuration.update(key, value, configurationTarget, overrideInLanguage)
    } catch (error) {
        log(`Failed update configuration array at key '${key}' to value '${value}'`)
        log(`${error}`)
    }
}

async function applyExtensionSettings(settings: any) {
    const configuration = vscode.workspace.getConfiguration(undefined,
        config.workspaceFolder
    )

    const luaConfiguration = vscode.workspace.getConfiguration(undefined, {
        uri: config.workspaceFolder.uri,
        languageId: 'lua'
    })

    for (const key in settings) {
        const value = settings[key]

        if (Array.isArray(value)) {
            const array = configuration.get<string[]>(key) ?? []

            for (const item of value) {
                if (!array.includes(item)) {
                    array.push(item)
                }
            }

            await updateConfiguration(configuration, key, array)
        } else if (typeof(value) == 'object') {
            if (key == '[lua]') {
                for (const key in value) {
                    await updateConfiguration(luaConfiguration, key, value[key],  undefined, true)
                }
            } else {
                let object = configuration.get<Object>(key) ?? {}
                object = Object.assign({}, object, value)
                await updateConfiguration(configuration, key, object)
            }
        } else {
            await updateConfiguration(configuration, key, value)
        }
    }
}

async function applyExtensionsSettings(extensionIds: string[]) {
    const settings = require('./data/settings')

    let settingsIds = Object.keys(extensions.recommended).filter(extensionId => {
        return extensionIds.includes(extensionId) || vscode.extensions.getExtension(extensionId)
    })

    settingsIds.push(config.extension.id)

    for (const extensionId of settingsIds) {
        const extensionSettings = settings.recommended[extensionId as keyof typeof settings.recommended]

        if (extensionSettings) {
            log(`Found settings for extension: '${extensionId}'`)

            try {
                await applyExtensionSettings(extensionSettings)
                log(`Applied settings for extension: '${extensionId}'`)
            } catch (error) {
                vscode.window.showWarningMessage(`Failed to apply settings for extension ${extensionId}`)
                log(`Failed to apply settings for extension '${extensionId}'`)
                log(`${error}`)
            }
        }
    }
}

async function applyWorkspaceRecommendations() {
    let json, data

    if (await utils.isPathExists(config.paths.workspaceRecommendations)) {
        data = await utils.readFile(config.paths.workspaceRecommendations)
    } else {
        log(`The '.vscode/extensions.json' file is not found, it will be created.`)
    }

    if (data) {
        try {
            log(`Decoding text from the '.vscode/extensions.json' file data`)
            const text = decoder.decode(data)

            log(`Parsing JSON from text`)
            json = JSON5.parse(text)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to parse the '.vscode/extensions.json' file. Does it have valid JSON?`)
            log(`Failed to convert the '.vscode/extensions.json' file data to JSON`)
            log(`${error}`)
            return
        }
    } else {
        json = {}
    }

    const recommendations: string[] = json.recommendations as string[] || []

    if (recommendations.includes(config.extension.id)) {
        log(`The '.vscode/extensions.json' file already has the '${config.extension.id}' recommendation`)
        return
    }

    recommendations.push(config.extension.id)
    json.recommendations = recommendations

    try {
        log(`Stringifying JSON to text `)
        const text = JSON.stringify(json, null, 4)

        log(`Encoding text to file data`)
        data = encoder.encode(text)
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update workspace recommendations. See Output for details.`)
        log(`Failed to convert JSON to the file data`)
        log(`${error}`)
        return
    }

    log(`Writing the '${config.extension.id}' recommendation to the '.vscode/extensions.json' file`)
    const isWritten = await utils.writeFile(config.paths.workspaceRecommendations, data)

    if (!isWritten) {
        vscode.window.showErrorMessage(`Failed to update workspace recommendations. See Output for details.`)
    }
}

export async function suggestSetup(text: string, soft?: boolean) {
    log(`Suggest to setup ${config.extension.displayName}`)

    const setupButton = `Setup ${config.extension.displayName}`
    const dontAskButton = `Don't ask anymore`

    const answer = await (
        soft ?
        vscode.window.showInformationMessage(text, setupButton, dontAskButton) :
        vscode.window.showInformationMessage(text, setupButton)
    )

    switch (answer) {
        case setupButton:
            vscode.commands.executeCommand(`${config.extension.commandPrefix}.setup`)
            break
        case dontAskButton:
            await config.context.workspaceState.update(momento.keys.dontSuggestSetup, true)
            break

        default:
            break
    }
}

export async function suggestSetupIfApplicable() {
    if (!utils.settingsBoolean(config.settingsKeys.suggestSetup)) {
        log(`Setup suggestion is turned off in settings`)
        return
    }

    if (await config.context.workspaceState.get(momento.keys.dontSuggestSetup)) {
        log(`The user has already asked not to suggest setup`)
        return
    }

    const isDefoldProject = await utils.isPathExists(config.paths.workspaceGameProject)
    const onceSetup = momento.getOnceSetup()

	if (onceSetup) {
		log(`No need to suggest ${config.extension.displayName} because it's already once setup`)
	} else if (isDefoldProject) {
		log(`No setup has ever been done in this workspace yet, so let's suggest setup ${config.extension.displayName}`)
        suggestSetup(`Defold project found. Do you want to setup ${config.extension.displayName}?`, false)
	}
}

export async function offerSelectDefoldPath(): Promise<config.DefoldConfiguration | undefined> {
    const settingsPath = config.defold?.editorPath
    const isSettingsPathExists = settingsPath != undefined && await utils.isPathExists(settingsPath)

    let suggestionItem: vscode.QuickPickItem | undefined
    let settingsItem: vscode.QuickPickItem | undefined

    const manualItem: vscode.QuickPickItem = {
        label: `$(file-directory) ${utils.isMac ? 'Select Defold Application' : 'Select Defold Folder'}`,
        detail: 'Opens the dialog to select a path manually',
        alwaysShow: true,
    }

    let pathItems = [manualItem]

    function detailForExistence(exists: boolean): string {
        return exists ? 'This path is valid and exists' : 'Warning: Looks like this path doesn\'t exists'
    }

    const suggestionPath = config.defoldPathSuggestion
    const isSuggestionPathExists = await utils.isPathExists(suggestionPath)
    const normalizedSuggestionPath = vscode.Uri.file(suggestionPath).fsPath

    if (isSuggestionPathExists && normalizedSuggestionPath != settingsPath) {
        suggestionItem = {
            label: `$(file-directory) ${suggestionPath}`,
            detail: detailForExistence(true),
            description: 'Suggestion',
            alwaysShow: true
        }

        pathItems.unshift(suggestionItem)
    }

    if (settingsPath) {
        settingsItem = {
            label: `$(check) ${settingsPath}`,
            detail: detailForExistence(isSettingsPathExists),
            description: 'Settings',
            alwaysShow: true
        }

        pathItems.unshift(settingsItem)
    }

    const selectedItem = await vscode.window.showQuickPick(pathItems, {
        title: `(1/4) ${config.extension.displayName} Setup`,
        placeHolder: 'Select a path to the Defold Editor',
        ignoreFocusOut: true,
    })

    if (!selectedItem) {
        return
    }

    switch (selectedItem) {
        case settingsItem:
            return await config.updateDefoldPath(settingsPath ?? '')

        case suggestionItem:
            return await config.updateDefoldPath(suggestionPath)

        default:
            const defaultUri = vscode.Uri.file(isSettingsPathExists ? settingsPath : suggestionPath)

            const dialogResult = await vscode.window.showOpenDialog({
                canSelectFiles: utils.isMac,
                canSelectFolders: !utils.isMac,
                canSelectMany: false,
                title: manualItem.label,
                defaultUri: defaultUri
            })

            const userPath = (dialogResult || []).at(0)?.fsPath

            if (userPath) {
                return await config.updateDefoldPath(userPath)
            } else {
                return await offerSelectDefoldPath()
            }
    }
}

export async function offerInstallExtensions(): Promise<string[] | undefined> {
    let extensionsItems: vscode.QuickPickItem[] = []

    for (const extensionId in extensions.recommended) {
        const extension = extensions.recommended[extensionId as keyof typeof extensions.recommended]

        if (vscode.extensions.getExtension(extensionId)) {
            continue
        }

        extensionsItems.push({
            label: `$(package) ${extension.title}`,
            detail: extension.detail,
            description: extensionId,
            picked: extension.picked,
            alwaysShow: true
        })
    }

    if (extensionsItems.length == 0) {
        log('All the recommended extensions are already installed, so the extensions picker is skipped')
        return []
    }

    momento.loadPickerSelection(extensionsItems, config.context.globalState, momento.keys.extensionInstallation)

    const selectedItems = await vscode.window.showQuickPick(extensionsItems, {
        canPickMany: true,
        title: `(2/4) ${config.extension.displayName} Setup`,
        placeHolder: 'Select extensions to install',
        ignoreFocusOut: true,
    })

    if (!selectedItems) {
        return
    }

    await momento.savePickerSelection(extensionsItems, selectedItems, config.context.globalState, momento.keys.extensionInstallation)

    let extensionIds: string[] = []

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Installing extension'
    }, async progress => {
        for (const extensionsItem of selectedItems) {
            const extensionId = extensionsItem.description

            if (!extensionId) {
                continue
            }

            log(`Installing the '${extensionId}' extension.`)
            progress.report({ message: extensionId})

            try {
                await vscode.commands.executeCommand('workbench.extensions.installExtension', extensionId)
            } catch(error) {
                vscode.window.showWarningMessage(`Failed to install the '${extensionId}' extension. See Output for details.`)
                log(`Failed to install the '${extensionId}' extension.`)
                log(`${error}`)
                continue
            }

            extensionIds.push(extensionId)
        }
    })

    return extensionIds
}

export async function offerSyncAnnotations(defoldVersion: string, title?: string): Promise<boolean> {
    let defoldItem: vscode.QuickPickItem = {
        label: '$(sync) Sync Defold API Annotations',
        detail: `Fetches Defold annotations and unpacks to the ${config.extension.displayName} storage`,
        alwaysShow: true,
        picked: true
    }

    let dependenciesItem: vscode.QuickPickItem = {
        label: '$(sync) Sync Dependencies API Annotations',
        detail: `Unpacks libraries and copies lua modules to the ${config.extension.displayName} storage`,
        alwaysShow: true,
        picked: true
    }

    const syncItems = [
        defoldItem,
        dependenciesItem
    ]

    momento.loadPickerSelection(syncItems, config.context.globalState, momento.keys.settingsApplying)

    const selectedItems = await vscode.window.showQuickPick(syncItems, {
        canPickMany: true,
        title: title ?? `(4/4) ${config.extension.displayName} Setup`,
        placeHolder: 'Select API annotations for autocomplete features',
        ignoreFocusOut: true,
    })

    if (!selectedItems) {
        return false
    }

    await momento.savePickerSelection(syncItems, selectedItems, config.context.globalState, momento.keys.settingsApplying)

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Syncing annotations'
    }, async progress => {
        if (selectedItems.includes(defoldItem)) {
            progress.report({ message: 'Defold API...' })
            await annotations.syncDefoldAnnotations(defoldVersion)
        }

        if (selectedItems.includes(dependenciesItem)) {
            progress.report({ message: 'Dependencies...' })
            await annotations.syncDependenciesAnnotations()
        }
    })

    return true
}

export async function offerApplySettings(extensionIds: string[]): Promise<boolean> {
    let debuggerItem: vscode.QuickPickItem = {
        label: '$(bug) Add Debugger Scripts',
        detail: `Adds 'debugger.lua' and 'debugger.script' files to this workspace`,
        alwaysShow: true,
        picked: true
    }

    let launchItem: vscode.QuickPickItem = {
        label: '$(rocket) Add Launch Configuration',
        detail: `Creates or edits the '.vscode/launch.json' file in this workspace`,
        alwaysShow: true,
        picked: true
    }

    let settingsItem: vscode.QuickPickItem = {
        label: '$(tools) Add Recommended Workspace Settings',
        detail: `Creates or edits the '.vscode/settings.json' file in this workspace`,
        alwaysShow: true,
        picked: true
    }

    let recomendationsItem: vscode.QuickPickItem = {
        label: `$(star) Add ${config.extension.displayName} to Workspace Recommendations`,
        detail: `Creates or edits the '.vscode/extensions.json' file in this workspace`,
        alwaysShow: true,
        picked: true
    }

    const settingsItems = [
        settingsItem,
        recomendationsItem
    ]

    if (extensionIds.includes(extensions.ids.localLuaDebugger) || vscode.extensions.getExtension(extensions.ids.localLuaDebugger)) {
        settingsItems.unshift(debuggerItem, launchItem)
    }

    momento.loadPickerSelection(settingsItems, config.context.globalState, momento.keys.settingsApplying)

    const selectedItems = await vscode.window.showQuickPick(settingsItems, {
        canPickMany: true,
        title: `(3/4) ${config.extension.displayName} Setup`,
        placeHolder: 'Select additional settings to apply',
        ignoreFocusOut: true,
    })

    if (!selectedItems) {
        return false
    }

    await momento.savePickerSelection(settingsItems, selectedItems, config.context.globalState, momento.keys.settingsApplying)

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Applying'
    }, async progress => {
        if (selectedItems.includes(debuggerItem)) {
            progress.report({ message: 'Debugger files...' })
            await copyDebuggerResources()
        }

        if (selectedItems.includes(launchItem)) {
            progress.report({ message: 'Launch configuration...' })
            await applyDebugConfigurations(extensionIds)
        }

        if (selectedItems.includes(settingsItem)) {
            progress.report({ message: 'Recommended settings...' })
            await applyExtensionsSettings(extensionIds)
        }

        if (selectedItems.includes(recomendationsItem)) {
            progress.report({ message: 'Workspace recommendations...' })
            await applyWorkspaceRecommendations()
        }
    })

    return true
}

export async function offerSelectBundleTargets(): Promise<string[]> {
    let targetItems: vscode.QuickPickItem[] = []
    let targetsAdapter: { [label: string]: string } = {}

    for (const target in config.bundleTargets) {
        const targetInfo = config.bundleTargets[target as keyof typeof config.bundleTargets]

        const targetItem: vscode.QuickPickItem = {
            label: targetInfo.label,
            detail: `architectures: ${targetInfo.architectures}`,
            description: `platform: ${targetInfo.platform}`,
            alwaysShow: true
        }

        targetItems.push(targetItem)
        targetsAdapter[targetInfo.label] = target
    }

    momento.loadPickerSelection(targetItems, config.context.workspaceState, momento.keys.bundleTarget)

    const selectedItems = await vscode.window.showQuickPick(targetItems, {
        canPickMany: true,
        title: 'Bundle Target',
        placeHolder: 'Select target OS for bundling',
        ignoreFocusOut: false,
    })

    if (!selectedItems || selectedItems.length == 0) {
        return []
    }

    await momento.savePickerSelection(targetItems, selectedItems, config.context.workspaceState, momento.keys.bundleTarget)

    const targets = selectedItems.map(targetItem => {
        return targetsAdapter[targetItem.label]
    })

    return targets
}

interface SelectedBundleOptions {
    isRelease: boolean,
    textureCompression: boolean,
    buildReport: boolean,
    debugSymbols: boolean,
    liveUpdate: boolean
}

export async function offerSelectBundleOptions(): Promise<SelectedBundleOptions | undefined> {
    let releaseItem: vscode.QuickPickItem = {
        label: '$(briefcase) Release',
        detail: 'Bundle Release variant (otherwise bundle Debug variant)',
        alwaysShow: true
    }

    let textureCompressionItem: vscode.QuickPickItem = {
        label: '$(file-zip) Texture Compression',
        detail: 'Enable texture compression as specified in texture profiles',
        alwaysShow: true
    }

    let debugSymbolsItem: vscode.QuickPickItem = {
        label: '$(key) Generate Debug Symbols',
        detail: 'Generate the symbol file (if applicable)',
        alwaysShow: true
    }

    let buildReportItem: vscode.QuickPickItem = {
        label: '$(checklist) Generate Build Report',
        detail: 'Generate the HTML build report file',
        alwaysShow: true
    }

    let liveUpdateItem: vscode.QuickPickItem = {
        label: '$(link) Publish Live Update Content',
        detail: 'Exclude the live update content in a separate archive',
        alwaysShow: true
    }

    const optionsItems = [
        releaseItem,
        textureCompressionItem,
        debugSymbolsItem,
        buildReportItem,
        liveUpdateItem
    ]

    momento.loadPickerSelection(optionsItems, config.context.workspaceState, momento.keys.bundleOption)

    const selectedItems = await vscode.window.showQuickPick(optionsItems, {
        canPickMany: true,
        title: 'Bundle Options',
        placeHolder: 'Select bundle options',
        ignoreFocusOut: false,
    })

    if (!selectedItems) {
        return
    }

    await momento.savePickerSelection(optionsItems, selectedItems, config.context.workspaceState, momento.keys.bundleOption)

    const options = {
        isRelease: selectedItems.includes(releaseItem),
        textureCompression: selectedItems.includes(textureCompressionItem),
        buildReport: selectedItems.includes(buildReportItem),
        debugSymbols: selectedItems.includes(debugSymbolsItem),
        liveUpdate: selectedItems.includes(liveUpdateItem)
    }

    return options
}