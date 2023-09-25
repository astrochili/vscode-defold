/*!
 * Defold Kit
 * https://github.com/astrochili/vscode-defold
 * Copyright (c) 2023 Roman Silin
 * MIT license
 *
 * The Defold name is a registered trademark of the Defold Foundation.
 * https://defold.com
 */

import * as config from '../config'
import { ids } from './extensions'

export const recommended = {
    [config.extension.id]: {
        'files.associations': {
            '*.project': 'ini',
            '*.script': 'lua',
            '*.gui_script': 'lua',
            '*.render_script': 'lua',
            '*.editor_script': 'lua',
            '*.fp': 'glsl',
            '*.vp': 'glsl',
            '*.go': 'textproto',
            '*.animationset': 'textproto',
            '*.atlas': 'textproto',
            '*.buffer': 'json',
            '*.camera': 'textproto',
            '*.collection': 'textproto',
            '*.collectionfactory': 'textproto',
            '*.collectionproxy': 'textproto',
            '*.collisionobject': 'textproto',
            '*.display_profiles': 'textproto',
            '*.factory': 'textproto',
            '*.gamepads': 'textproto',
            '*.gui': 'textproto',
            '*.input_binding': 'textproto',
            '*.label': 'textproto',
            '*.material': 'textproto',
            '*.mesh': 'textproto',
            '*.model': 'textproto',
            '*.particlefx': 'textproto',
            '*.render': 'textproto',
            '*.sound': 'textproto',
            '*.spinemodel': 'textproto',
            '*.spinescene': 'textproto',
            '*.sprite': 'textproto',
            '*.texture_profiles': 'textproto',
            '*.tilemap': 'textproto',
            '*.tilesource': 'textproto',
            '*.manifest': 'textproto'
        }
    },

    [ids.luaLanguageServer]: {
        '[lua]': {
            'editor.defaultFormatter': ids.luaLanguageServer
        },
        'Lua.runtime.version': 'Lua 5.1',
        'Lua.window.statusBar': false,
        'Lua.telemetry.enable': false,
        'Lua.completion.callSnippet': 'Replace',
        'Lua.completion.keywordSnippet': 'Replace',
        'Lua.completion.showWord': 'Fallback',
        'Lua.completion.autoRequire': false,
        'Lua.diagnostics.libraryFiles': 'Disable',
        'Lua.diagnostics.globals': [
            'msg',
            'sound',
            'hash',
            'vmath',
            'gui',
            'socket',
            'sys',
            'render',
            'go',
            'factory',
            'resource',
            'pprint',
            'timer',
            'particlefx',
            'spine',
            'sprite',
            'json',
            'window',
            'physics'
        ],
        'Lua.diagnostics.disable': [
            'lowercase-global',
            'redefined-local'
        ],
        'Lua.workspace.library': [
        ]
    },

    [ids.glslLint]: {
        'glsllint.additionalStageAssociations': {
            '.fp': 'frag',
            '.vp': 'vert'
        }
    }
};