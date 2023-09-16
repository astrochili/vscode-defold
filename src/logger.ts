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

let outputChannel: vscode.LogOutputChannel

interface LogOptions {
	openOutput: boolean
}

export default function log(message: string, options?: LogOptions) {
	if (!outputChannel) {
		outputChannel = vscode.window.createOutputChannel(
			config.extension.displayName,
			{ log: true }
		)
	}

	outputChannel.appendLine(message)

	if (options?.openOutput) {
		outputChannel.show()
	}

	console.log(message)
}