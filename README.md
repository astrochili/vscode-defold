# How to get VSCode to be Defold IDE

This guide will help you to configure VSCode for developing games with Defold.

- Use syntax highlighting and linting.
- Use powerful IntelliSense (standard lua, Defold API, libraries, project code).
- Build and bundle the game with VSCode tasks.
- Launch the game with VSCode debugger.
- Debug with common features (call stacks, breakpoints, stepping, inspecting, evaluating).

## Quick start

1. Download this ready to use project.
2. Download [bob.jar](https://d.defold.com/stable/) and [dmengine](https://d.defold.com/stable/) for your desktop platform.
3. Configure paths to `bob.jar` and `dmengine` in `.vscode/settings.json`.
4. Install recommended by `.vscode/extensions.json` VSCode extensions.
5. Press **Ctrl/Cmd+B** for tasks or **Ctrl/Cmd+R** to launch and debug.

## Extensions

These extentions are listed in workspace recommendations so it shouldn't be a problem to install them quickly in the VSCode Extensions pane.

- [sumneko.lua](https://marketplace.visualstudio.com/items?itemName=sumneko.lua) - A powerful Lua language server with IntelliSense.
- [tomblind.local-lua-debugger-vscode](https://marketplace.visualstudio.com/items?itemName=tomblind.local-lua-debugger-vscode) - A nice local debugger for Lua.
- [thesofakillers.vscode-pbtxt](https://marketplace.visualstudio.com/items?itemName=thesofakillers.vscode-pbtxt) - Textual Protobuf syntax highlighting.
- [slevesque.shader](https://marketplace.visualstudio.com/items?itemName=slevesque.shader) - Shader languages support.
- [cadenas.vscode-glsllint](https://marketplace.visualstudio.com/items?itemName=cadenas.vscode-glsllint) - Linting of OpenGL Shading Language.

## Configuration

### Bob and Engine

Bob is required for resolving dependencies, building and bundling. The engine is required to run your game.

Download [bob.jar](https://d.defold.com/stable/) and [dmengine](https://d.defold.com/stable/) for your desktop platform and configure paths to them in `.vscode/settings.json`:

```js
{
    // The path to your bob.jar for building.
    "defold.bob_path": "/Applications/Defold.app/bob.jar",

    // The path to your dmengine for running. 
    "defold.dmengine_path": "/Applications/Defold.app/dmengine",
}
```

### Defold API

Lua headers with Defold API are generated with [IntelliJ-Defold-Api](https://github.com/d954mas/IntelliJ-Defold-Api) by [d954mas](https://github.com/d954mas). Download `defold_api.zip` from the [releases](https://github.com/d954mas/IntelliJ-Defold-Api/releases) page and unarchive it to the `.defold-api` folder in your workspace.

### Libraries

To help the language server to find external libraries and parse their headers you need to unarchive the `*.zip` files in the `.internal/lib/` folder. Don't delete the archives themselves of course.

Unarchive only libraries without native extensions. If you want to unarchive a mixed library with a navive extension and Lua modules, you will need to remove the native extension part after unarchiving, otherwise the build will fail.

### Settings

Use `.vscode/settings.json` as your VSCode settings. If you work with many Defold projects, then it would be reasonable to copy them to the user settings instead of workspace settings.

Some of settings are required for IntelliSense to work properly, but most of them just make your development with Lua and Defold much more comfortable.

## Tasks

VSCode tasks are available with the default shortcut **Ctrl/Cmd+B**.

- `bob: clean` to clean the build folder. Runs bob with `distclean`.
- `bob: resolve` to fetch dependencies. Runs bob with `resolve`.
- `bob: build` to make a build for debugging. Runs bob with `--variant debug build`.
- `bob: bundle` to select a platform and make a bundle. *Please configure your preferred arguments in `.vscode/bob.sh`.*

## Debugger

Debugging is provided with [local-lua-debugger-vscode](https://marketplace.visualstudio.com/items?itemName=tomblind.local-lua-debugger-vscode) by [tomblind](https://github.com/tomblind). The VSCode extension runs `dmengine` locally and interacts with it via `stdio`.

To debug you also need to start the debugger on the game side:

```lua
local debugger = require('modules.lldebugger')
debugger.start()
```

There are two launch configurations: `Build & Run` and `Just Run`. The only difference between them is launching of the building pre-task `bob: build`. You can launch the selected configuration by the default shortcut **Ctrl/Cmd+R**.

## Logs

- Bob's tasks output logs to the Terminal tab.
- The game outputs logs to the Debug Console tab.

## Limitations

At this moment you must use a modified `modules/lldebugger.lua` from this repository. But after resolving [#33](https://github.com/tomblind/local-lua-debugger-vscode/issues/33) and [#5703](https://github.com/defold/defold/issues/5703) it will be possible to use `lldebugger.lua` from the installed VSCode extension folder.

There is no way to change breakpoints at runtime, only on pauses. See [#32](https://github.com/tomblind/local-lua-debugger-vscode/issues/32).