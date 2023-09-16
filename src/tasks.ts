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

function makeTask(name: string, command: string): vscode.Task {
	const task = new vscode.Task(
		{ type: 'shell' },
		vscode.TaskScope.Workspace,
		name,
		'Defold',
		new vscode.ShellExecution('exit${command:' + config.extension.name + '.' + command + '}')
	)

	task.group = vscode.TaskGroup.Build
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
		makeTask(buildTaskName, 'build'),
		makeTask('Bundle', 'bundle'),
		makeTask('Clean Build', 'cleanBuild'),
		makeTask('Resolve Dependencies', 'resolve'),
		makeTask('Deploy to Mobile', 'deploy'),
		makeTask('Launch (without Debugger)', 'launch'),
	]
}