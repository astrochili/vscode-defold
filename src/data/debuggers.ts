/*!
 * Defold Kit
 * https://github.com/astrochili/vscode-defold
 * Copyright (c) 2023 Roman Silin
 * MIT license
 *
 * The Defold name is a registered trademark of the Defold Foundation.
 * https://defold.com
 */

import * as extensions from './extensions'
import * as tasks from '../tasks'

export const recommended = {
    [extensions.ids.localLuaDebugger]: {
        'name': 'Defold Kit',
        'type': 'lua-local',
        'request': 'launch',
        'stopOnEntry': false,
        'verbose': false,
        'internalConsoleOptions': 'openOnSessionStart',
        'program': { 'command': 'build/defoldkit/dmengine' },
        'args': ['build/defoldkit/game.projectc'],
        'windows': {
            'program': { 'command': 'build\\defoldkit\\dmengine.exe' },
            'args': ['build\\defoldkit\\game.projectc']
        },
        'preLaunchTask': `Defold Kit: ${tasks.buildTaskName}`
    }
}