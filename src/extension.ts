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
import * as config from './config'
import * as momento from './momento'
import * as utils from './utils'
import * as commands from './commands'
import * as tasks from './tasks'
import * as migration from './migration'
import * as wizard from './wizard'
import log from './logger'

let runningCommand: string | undefined

export async function activate(context: vscode.ExtensionContext) {
	const workspaceFolder = vscode.workspace.workspaceFolders?.at(0)
	if (!workspaceFolder) {
		log(`Cannot activate the extension because the workspace folder is not found`)
		return
	}

	const workspaceStoragePath = context.storageUri?.fsPath
	if (!workspaceStoragePath) {
		log(`Cannot activate the extension because the workspace storage folder is not found`)
		return
	}

	const globalStoragePath = context.globalStorageUri?.fsPath
	if (!globalStoragePath) {
		log(`Cannot activate the extension because the global storage folder is not found`)
		return
	}

	await config.init(context, workspaceFolder, workspaceStoragePath, globalStoragePath)

	for (const command of Object.keys(commands)) {
		const action = commands[command as keyof typeof commands]
		const commandId = `${config.extension.commandPrefix}.${command}`

		context.subscriptions.push(vscode.commands.registerCommand(commandId, async () => {
			if (!await utils.isPathExists(config.paths.workspaceGameProject)) {
				vscode.window.showWarningMessage(`Doesn't look like a Defold project`)
				log(`A user tried to run command '${commandId}' without Defold project`)
				return
			}

			if (runningCommand) {
				vscode.window.showWarningMessage(`Cannot run the command '${commandId}' until another command '${runningCommand}' is finished`)
				log(`A user tried to run command '${commandId}' during another command '${runningCommand}'.`)
				return
			}

			log(`Command '${commandId}' is called`)
			runningCommand = commandId

			try {
				await config.init(context, workspaceFolder, workspaceStoragePath, globalStoragePath)
				await action()
			} catch (error) {
				vscode.window.showWarningMessage(`Unexpected error occured during running the command '${commandId}'. See Output for details.`)
				log(`Unhandled exception during running the command '${commandId}': ${error}}`)
			}

			runningCommand = undefined
			log(`Command '${commandId}' is finished`)

			// Need to return a string to use it as a preLaunchTask
			return ''
		}))
	}

	vscode.tasks.registerTaskProvider(config.extension.taskPrefix, {
		provideTasks: () => {
			return tasks.makeTasks()
		},
		resolveTask(_task: vscode.Task): vscode.Task | undefined {
			return undefined
		}
	})

	const lastGlobalMigrationVersion = momento.getLastGlobalMigrationVersion()
	if (lastGlobalMigrationVersion != config.extension.version) {
		log(`Starting global migration from ${lastGlobalMigrationVersion} to ${config.extension.version}.`)
		await migration.migrateGlobal(lastGlobalMigrationVersion)
	} else {
		log(`Last global migration version is ${lastGlobalMigrationVersion}. No need to migrate.`)
	}

	const lastWorkspaceMigrationVersion = momento.getLastWorkspaceMigrationVersion()
	if (lastWorkspaceMigrationVersion != config.extension.version) {
		log(`Starting workspace migration from ${lastWorkspaceMigrationVersion} to ${config.extension.version}.`)
		await migration.migrateWorkspace(lastWorkspaceMigrationVersion)
	} else {
		log(`Last workspace migration version is ${lastWorkspaceMigrationVersion}. No need to migrate.`)
	}

	log(`Extension '${config.extension.displayName}' is activated`)

	wizard.suggestSetupIfApplicable()
}

export function deactivate() {
	log(`Extension '${config.extension.displayName}' is deactivated`)
}