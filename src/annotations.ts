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
import * as os from 'os'
import * as crypto from 'crypto'
import * as config from './config'
import * as utils from './utils'
import * as extensions from './data/extensions'
import log from './logger'
import axios from 'axios'
import path = require('path')
import Zip = require('adm-zip')
const ini = require('ini')

interface LatestReleaseResponse {
    tag_name: string
}

async function fetchLatestRelease(repositoryKey: string | undefined): Promise<LatestReleaseResponse | undefined> {
    const fallbackReleaseUrl = config.urls.fallbackReleaseUrl(repositoryKey)

    try {
        log(`Network request GET: '${fallbackReleaseUrl}'`)
        const response = await axios.get<LatestReleaseResponse>(fallbackReleaseUrl)
        log(`Network response OK'`)
        return response.data
    } catch (error) {
        log(`Network request FAILED'`)
        log(`'${error}'`)
    }
}

async function fetchSpecificAsset(tag: string, repositoryKey: string | undefined): Promise<Uint8Array | undefined> {
    const annotationsUrl = config.urls.annotationsAsset(tag, repositoryKey)

    try {
        log(`Network request GET: '${annotationsUrl}'`)
        const response = await axios.get<Uint8Array>(annotationsUrl, { responseType: 'arraybuffer' })
        log(`Network response OK'`)
        return response.data
    } catch (error) {
        log(`Network request FAILED'`)
        log(`'${error}'`)
    }
}

async function fetchDefoldAnnotations(defoldVersion: string): Promise<string | undefined> {
    log(`Starting fetch Defold annotations`)

    if (await utils.isPathExists(config.paths.globalStorage)) {
        log(`Global storage folder exists, no need to create`)
    } else {
        log(`Creating the global storage: ${config.paths.globalStorage}`)
        if (!await utils.createDirectory(config.paths.globalStorage)) {
            vscode.window.showErrorMessage(`Failed to create global storage folder. See Output for details.`)
            return
        }
    }

    log(`Defold version: ${config.defold?.version}`)

    const repositoryKey = utils.settingsString(config.settingsKeys.annotationsRepository)
    log(`Defold annotations repository: ${repositoryKey}`)

    const annotationsUrl = config.urls.annotationsAsset(defoldVersion, repositoryKey)
    log(`Direct annotations url: ${annotationsUrl}`)

    let data = await fetchSpecificAsset(defoldVersion, repositoryKey)

    if (!data) {
        log(`Failed to fetch the specific release`)
        log(`Let's try to fetch the latest available annotations`)
        const latestRelease = await fetchLatestRelease(repositoryKey)

        if (latestRelease) {
            const annotationsVersion = latestRelease.tag_name
            data = await fetchSpecificAsset(annotationsVersion, repositoryKey)
        }
    }

    if (!data) {
        vscode.window.showErrorMessage(`Can't fetch Defold annotations. See Output for details.`);
        return
    }

    const apiPath = config.paths.defoldApi

    log(`Cleaning directory: ${apiPath}`)
    const isClean = await utils.deleteFile(apiPath) && await utils.createDirectory(apiPath)

    if (!isClean) {
        vscode.window.showErrorMessage(`Failed to clean the libraries api folder. See Output for details.`)
        return
    }

    const outputPath = path.join(apiPath, 'annotations.zip')

    log(`Writing response data to '${outputPath}'`)
    const isWriten = await utils.writeDataFile(outputPath, data)

    if (!isWriten) {
        vscode.window.showErrorMessage(`Can't fetch Defold annotations. See Output for details.`);
        return
    }

    try {
        log(`Initializing Zip instance for '${outputPath}'`)
        const zip = new Zip(outputPath)
        const entries = zip.getEntries()

        log(`Extracting lua files from '${outputPath}' to '${apiPath}'`)
        for (const entry of entries) {
            if (entry.name.endsWith('.lua')) {
                zip.extractEntryTo(entry, apiPath, false, true)
            }
        }
   } catch (error) {
        vscode.window.showErrorMessage(`Can't fetch Defold annotations. See Output for details.`);
        log(`Failed to unzip '${outputPath}' to '${apiPath}'`)
        log(`${error}`)
    }

    log(`Deleting '${outputPath}'`)
    await utils.deleteFile(outputPath)

    return config.paths.globalStorage
}

async function unpackDependenciesAnnotations(): Promise<string | undefined> {
    const libPath = config.paths.workspaceLibs

    if (!await utils.isPathExists(libPath)) {
        log(`Dependencies folder '${libPath}' not found, unpacking extensions skipped`)
        return
    }

    if (await utils.isPathExists(config.paths.workspaceStorage)) {
        log(`Workspace storage folder exists, no need to create`)
    } else {
        log(`Creating the workspace storage: ${config.paths.workspaceStorage}`)
        if (!await utils.createDirectory(config.paths.workspaceStorage)) {
            vscode.window.showErrorMessage(`Failed to create workspace storage folder. See Output for details.`)
            return
        }
    }

    const apiPath = config.paths.libsApi

    log(`Cleaning directory: ${apiPath}`)
    const isClean = await utils.deleteFile(apiPath) && await utils.createDirectory(apiPath)

    if (!isClean) {
        vscode.window.showErrorMessage(`Failed to clean the libraries api folder. See Output for details.`)
        return
    }

    let projectText
    log(`Reading list of dependencies in game project.`)

    if (await utils.isPathExists(config.paths.workspaceGameProject)) {
        projectText = await utils.readTextFile(config.paths.workspaceGameProject)
    } else {
        log(`The '${config.paths.workspaceGameProject}' file is not found.`)
    }

    if (!projectText) {
        vscode.window.showErrorMessage(`Failed to read the '${config.paths.workspaceGameProject}' file. See Output for details.`)
        return
    }

    log(`Parsing game project dependencies...`)
    let dependencyHashes: string[] = []
    const projectLines = projectText.split('\n')
    const dependencyLines = projectLines.filter(line => line.startsWith('dependencies#'))

    for (const dependencyLine of dependencyLines) {
        const regex = /\s*[^=]+\s*=\s*(.*)/
        const match = dependencyLine.match(regex)

        if (!match) {
            log(`Failed to parse dependency line '${dependencyLine}'`)
            continue
        }

        const sha = crypto.createHash(`sha1`)
        const dependencyUrl = match[1]

        try {
            sha.update(dependencyUrl)
            const dependencyHash = sha.digest(`hex`)
            dependencyHashes.push(dependencyHash)
        } catch(error) {
            log(`Failed to generate sha1 hash for dependency url ${dependencyUrl}`)
            continue
        }
    }

    log(`Reading extensions folder: ${libPath}`)
    let files = await utils.readDirectory(libPath)

    if (files == undefined) {
        vscode.window.showErrorMessage(`Failed to read the '.internal' folder. See Output for details.`)
        return
    }

    log(`Filtering *.zip files according project dependencies...`)
    files = files.filter(file => {
        const filename = file[0]

        if (!filename.endsWith('.zip')) {
            return false
        }

        for (const dependenciesHash of dependencyHashes) {
            if (filename.startsWith(dependenciesHash)) {
                return true
            }
        }

        log(`File '${filename}' skipped.`)
        return false
    })

    for (const file of files) {
        const filePath = path.join(libPath, file[0])

        let zip: Zip | undefined
        let zipEntries: Zip.IZipEntry[] | undefined

        try {
            log(`Reading extension archive: ${filePath}`)
            zip = new Zip(filePath)
            zipEntries = zip.getEntries()
        } catch (error) {
            vscode.window.showWarningMessage(`Failed to read the '${file[0]}' archive. See Output for details.`)
            return
        }

        let libraryDirs = new Array<string>
        let projectPath: string | undefined

        for (const zipEntry of zipEntries) {
            const internalPath = zipEntry.entryName

            if (internalPath.endsWith(config.constants.gameProject)) {
                log(`Found the project file: ${internalPath}`)

                const projectDir = path.dirname(internalPath)
                log(`The library project directory is: ${projectDir}`)
                projectPath = projectDir

                try {
                    log(`Reading as text: ${internalPath}`)
                    const projectContent = zip.readAsText(internalPath)

                    log(`Parsing as INI...`)
                    const project = ini.parse(projectContent)

                    log(`Parsing library property...`)
                    const includeDirs = project.library.include_dirs as string

                    libraryDirs = includeDirs.split(',').map(directory => {
                        return path.join(projectDir, directory.trim())
                    })
                } catch (error) {
                    log(`Failed to parse library dirs in the '${internalPath}' file`)
                    log(`${error}`)
                }

                break
            }
        }

        if (!projectPath) {
            log(`The '${config.constants.gameProject}' file not found inside the archive ${filePath}`)
            return
        }

        log(`Unpacking from '${file[0]}' to '${path.join(apiPath, projectPath)}`)

        for (const zipEntry of zipEntries) {
            const internalPath = zipEntry.entryName.replaceAll('/', path.sep)

            for (const libraryDir of libraryDirs) {
                if (internalPath.startsWith(libraryDir) && internalPath.endsWith('.lua')) {
                    try {
                        let internalPathParts = internalPath.split(path.sep)
                        internalPathParts = internalPathParts.splice(1, internalPathParts.length - 2)

                        let targetExtractPath = path.join(...internalPathParts)
                        targetExtractPath = path.join(apiPath, targetExtractPath)

                        zip.extractEntryTo(zipEntry, targetExtractPath, false, true)
                    } catch (error) {
                        log(`Failed to unzip '${internalPath}' from '${file[0]}' to '${apiPath}'`)
                        log(`${error}`)
                    }
                }
            }
        }
    }

    return config.paths.workspaceStorage
}

async function addToWorkspaceSettings(annotationsPath: string): Promise<boolean> {
    log(`Updating annotations paths in workspace settings: '${annotationsPath}'`)

    if (!vscode.extensions.getExtension(extensions.ids.luaLanguageServer)) {
        log(`No need to update annotations paths because there is no '${extensions.ids.luaLanguageServer}' extensions`)
        return true
    }

    const configuration = vscode.workspace.getConfiguration(undefined, config.workspaceFolder)
    const libraryKey = config.constants.sumnekoSettingsLibraryKey
    let libraries = configuration.get<string[]>(libraryKey) ?? []

    const homeDir = vscode.Uri.file(os.homedir()).fsPath
    const safeAnnotationsPath = annotationsPath.replace(homeDir, config.constants.homedirShortcut)

    if (libraries.includes(safeAnnotationsPath)) {
        log(`The '${libraryKey}' already has this annotations path, no need to touch`)
        return true
    } else {
        log(`Adding '${safeAnnotationsPath}' to '${libraryKey}'`)
        libraries.push(safeAnnotationsPath)

        try {
            await configuration.update(libraryKey, libraries);
            return true
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add the annotations path to workspace settings. See Output for details.`)
            log(`Unexpected error during adding the annotations path to workspace settings`)
            log(`${error}`, { openOutput: true })
            return false
        }
    }
}

async function removeFromWorkspaceSettings(annotationsPath: string): Promise<boolean> {
    log(`Removing annotations paths in workspace settings: '${annotationsPath}'`)

    const configuration = vscode.workspace.getConfiguration(undefined, config.workspaceFolder)
    const libraryKey = config.constants.sumnekoSettingsLibraryKey
    let libraries = configuration.get<string[]>(libraryKey)

    if (!libraries) {
        return true
    }

    const safeAnnotationsPath = annotationsPath.replace(os.homedir(), config.constants.homedirShortcut)

    if (!libraries.includes(safeAnnotationsPath)) {
        log(`The '${libraryKey}' doesn't have this annotations path, nothing to remove`)
        return true
    } else {
        log(`Removing '${safeAnnotationsPath}' from '${libraryKey}'`)
        libraries = libraries.filter(path => { return path != safeAnnotationsPath})

        try {
            await configuration.update(libraryKey, libraries);
            return true
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to remove the annotations path from workspace settings. See Output for details.`)
            log(`Unexpected error during removing the annotations path from workspace settings`)
            log(`${error}`, { openOutput: true })
            return false
        }
    }
}

export async function syncDefoldAnnotations(defoldVersion: string): Promise<boolean> {
    log('Syncing Defold API annotations')
    const defoldAnnotationsPath = await fetchDefoldAnnotations(defoldVersion)

    if (defoldAnnotationsPath) {
        return await addToWorkspaceSettings(defoldAnnotationsPath)
    } else {
        return false
    }
}

export async function syncDependenciesAnnotations(): Promise<boolean> {
    log('Syncing dependencies annotations')
    const dependenciesAnnotationsPath = await unpackDependenciesAnnotations()

    if (dependenciesAnnotationsPath) {
        return await addToWorkspaceSettings(dependenciesAnnotationsPath)
    } else {
        return false
    }
}

export async function cleanAnnotations(): Promise<boolean> {
    log(`Cleaning directory: ${config.paths.defoldApi}`)
    if (!await utils.deleteFile(config.paths.defoldApi)) {
        vscode.window.showErrorMessage(`Failed to clean the Defold annotations folder. See Output for details.`)
        return false
    }

    log(`Removing from the Defold annotations path workspace settings`)
    if (!await removeFromWorkspaceSettings(config.paths.globalStorage)) {
        vscode.window.showErrorMessage(`Failed to remove the Defold annotations path from the workspace settings. See Output for details.`)
        return false
    }

    log(`Cleaning directory: ${config.paths.libsApi}`)
    if (!await utils.deleteFile(config.paths.libsApi)) {
        vscode.window.showErrorMessage(`Failed to clean the dependencies annotations folder. See Output for details.`)
        return false
    }

    log(`Removing from the dependencies annotations path workspace settings`)
    if (!await removeFromWorkspaceSettings(config.paths.workspaceStorage)) {
        vscode.window.showErrorMessage(`Failed to remove the dependencies annotations path from the workspace settings. See Output for details.`)
        return false
    }

    return true
}