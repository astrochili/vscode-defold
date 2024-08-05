/*!
 * Defold Kit
 * https://github.com/astrochili/vscode-defold
 * Copyright (c) 2023 Roman Silin
 * MIT license
 *
 * The Defold name is a registered trademark of the Defold Foundation.
 * https://defold.com
 */

export const ids = {
    luaLanguageServer: 'sumneko.lua',
    localLuaDebugger: 'tomblind.local-lua-debugger-vscode',
    textProtoId: 'thejustinwalsh.textproto-grammer',
    glslLanguage: 'slevesque.shader',
    glslLint: 'dtoplak.vscode-glsllint'
}

export const recommended = {
    [ids.luaLanguageServer]: {
        title: 'Lua Language Server',
        detail: '[Required] Autocompletion, annotations, diagnostics and etc.',
        picked: true
    },
    [ids.localLuaDebugger]: {
        title: 'Local Lua Debugger',
        detail: '[Recommended] Launching the game to debug with breakpoints',
        picked: true
    },
    [ids.textProtoId]: {
        title: 'Text Proto',
        detail: '[Optional] Syntax highlighting for `.collection`, `.go` and other Protobuf files',
        picked: false
    },
    [ids.glslLanguage]: {
        title: 'Shader Languages Support for Visual Studio Code',
        detail: '[Optional] GLSL support for `.vp` and `.fp` files',
        picked: false
    },
    [ids.glslLint]: {
        title: 'GLSL Linting for Visual Studio Code',
        detail: '[Optional] GLSL linting for `.vp` and `.fp` files',
        picked: false
    }
}