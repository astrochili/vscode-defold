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

function makeTask(name: string, command: string, group: vscode.TaskGroup | undefined): vscode.Task {
	const task = new vscode.Task(
		{ type: 'shell' },
		vscode.TaskScope.Workspace,
		name,
		'Defold Kit',
		new vscode.ShellExecution('exit${command:' + config.extension.commandPrefix + '.' + command + '}')
	)

	task.group = group
	task.presentationOptions = {
		echo: false,
		focus: false,
		reveal: vscode.TaskRevealKind.Silent,
		showReuseMessage: false,
		close: true,
		clear: true
	}

	return task
}

export const buildTaskName = 'Build to Launch'

export function makeTasks(): vscode.Task[] {
	return [
		makeTask(buildTaskName, 'build', undefined),
		makeTask('Bundle', 'bundle', vscode.TaskGroup.Build),
		makeTask('Clean Build', 'cleanBuild', vscode.TaskGroup.Build),
		makeTask('Resolve Dependencies', 'resolve', vscode.TaskGroup.Build),
		makeTask('Deploy to Mobile', 'deploy', vscode.TaskGroup.Build)
	]
}