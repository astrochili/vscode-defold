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
        detail: '[Recommended] Autocompletion, annotations, diagnostics and etc.',
    },
    [ids.localLuaDebugger]: {
        title: 'Local Lua Debugger',
        detail: '[Recommended] Debugging with breakpoints directly in VSCode',
    },
    [ids.textProtoId]: {
        title: 'Text Proto',
        detail: '[Optional] Syntax highlighting for `.collection`, `.go` and other Protobuf files',
    },
    [ids.glslLanguage]: {
        title: 'Shader Languages Support for Visual Studio Code',
        detail: '[Optional] GLSL support for `.vp` and `.fp` files'
    },
    [ids.glslLint]: {
        title: 'GLSL Linting for Visual Studio Code',
        detail: '[Optional] GLSL linting for `.vp` and `.fp` files'
    }
}