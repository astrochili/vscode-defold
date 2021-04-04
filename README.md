# How to turn VSCode into Defold IDE

This guide will help you to configure VSCode for developing games with [Defold](https://defold.com/).

- Syntax highlighting and linting.
- Powerful IntelliSense (standard lua, Defold API, libraries, project code).
- Building and launching the game from VSCode.
- Debugging with breakpoints, call stacks, stepping, inspecting and evaluating.

This allows you not to use Defold Editor all the time if you are working only with the code at the moment.

## Quick start

1. Download this ready to use project or adapt your own.
2. Download [bob.jar](https://d.defold.com/stable/) and [dmengine](https://d.defold.com/stable/) for your desktop platform.
3. Configure paths to `bob.jar` and `dmengine` in `.vscode/defold.sh`.
4. Install recommended by `.vscode/extensions.json` VSCode extensions.
5. *Only for Windows.* Install bash following [this instruction](https://stackoverflow.com/a/50527994/6352765).
6. Open tasks list (**[Ctrl/Cmd]-Shift-B** by default) or launch the game to debug (**F5** by default).

## Extensions

These extentions are listed in workspace recommendations so it shouldn't be a problem to install them quickly in the VSCode Extensions pane.

- [sumneko.lua](https://marketplace.visualstudio.com/items?itemName=sumneko.lua) - A powerful Lua language server with IntelliSense.
- [tomblind.local-lua-debugger-vscode](https://marketplace.visualstudio.com/items?itemName=tomblind.local-lua-debugger-vscode) - A nice local debugger for Lua.
- [thesofakillers.vscode-pbtxt](https://marketplace.visualstudio.com/items?itemName=thesofakillers.vscode-pbtxt) - Textual Protobuf syntax highlighting.
- [slevesque.shader](https://marketplace.visualstudio.com/items?itemName=slevesque.shader) - Shader languages support.
- [cadenas.vscode-glsllint](https://marketplace.visualstudio.com/items?itemName=cadenas.vscode-glsllint) - Linting of OpenGL Shading Language.

#### Why not [EmmyLua](https://github.com/EmmyLua/VSCode-EmmyLua)?
In fact, this is also a great option. The key difference is that `sunmeko.lua` in addition can generate autocomplete *without* annotations.

#### Why not the built-in [mobdebug](https://github.com/pkulchenko/MobDebug)?
Unfortunately there is no the mobdebug extension for VSCode at this moment.

## Configuration

### Bob and Engine

Bob is required for resolving dependencies, building and bundling. The engine is required to run your game.

Download [bob.jar](https://d.defold.com/stable/) and [dmengine](https://d.defold.com/stable/) for your desktop platform and configure paths to them in `.vscode/defold.sh`:

```bash
# The path to your bob.jar for building
bob_path="/Applications/Defold.app/bob.jar"

# The path to your dmengine for running without NE
dummy_engine_path="/Applications/Defold.app/dmengine"
```

### Defold API

Lua headers with Defold API are generated with [IntelliJ-Defold-Api](https://github.com/d954mas/IntelliJ-Defold-Api) by [d954mas](https://github.com/d954mas). Download `defold_api.zip` from the [releases](https://github.com/d954mas/IntelliJ-Defold-Api/releases) page and unarchive it to the `.defold-api` folder in your workspace.

![intellisense](https://user-images.githubusercontent.com/4752473/113480000-ca02fd00-949a-11eb-9194-f4e546faef93.gif)

### Libraries

To help the language server to find external libraries and parse their headers you need to unarchive the `*.zip` files in the `.internal/lib/` folder. Don't delete the archives themselves of course.

Unarchive only libraries without native extensions. If you want to unarchive a mixed library with a navive extension and Lua modules, you will need to remove the native extension part after unarchiving, otherwise the build will fail.

### Settings

Use `.vscode/settings.json` as your VSCode settings. If you work with many Defold projects, then it would be reasonable to copy them to the user settings instead of workspace settings.

Some of settings are required for IntelliSense to work properly, but most of them just make your development with Lua and Defold much more comfortable.

### Git

There are `.gitignore` and `.gitattributes` files that should help your git to work more correctly with your Defold project.

## Tasks

VSCode tasks are available with shortcut **[Ctrl/Cmd]-Shift-B** by default.

![tasks](https://user-images.githubusercontent.com/4752473/113480040-fcacf580-949a-11eb-8b8b-da39591373cb.gif)

- `bob: clean` to clean the build folder. Runs bob with `distclean`.
- `bob: resolve` to fetch dependencies. Runs bob with `resolve`.
- `bob: build` to make a build for debugging. Runs bob with `--variant debug build`.
- `bob: bundle` to select the platform and make a bundle.

You can configure additional arguments for dependencies resolution and bundling on the top of `.vscode/defold.sh`.

## Debugger

Debugging is provided with [local-lua-debugger-vscode](https://marketplace.visualstudio.com/items?itemName=tomblind.local-lua-debugger-vscode) by [tomblind](https://github.com/tomblind). The VSCode extension runs `dmengine` locally and interacts with it via `stdio`.

![debugger](https://user-images.githubusercontent.com/4752473/113479667-0897b800-9499-11eb-91c3-00eee42e83f2.gif)

To debug you also need to start the debugger on the game side:

```lua
local debugger = require('modules.lldebugger')
debugger.start()
```

There are two launch configurations: `Build & Run` and `Just Run`. The only difference between them is launching of the building pre-task `bob: build`.

You can launch the selected configuration by shortcut **F5** by default.

## Logs

- Bob's tasks output logs to the Terminal tab.
- The game outputs logs to the Debug Console tab.

## Limitations

At this moment you must use a modified `modules/lldebugger.lua` from this repository. But after resolving [tomblind/local-lua-debugger-vscode/#33](https://github.com/tomblind/local-lua-debugger-vscode/issues/33) and [defold/defold#5703](https://github.com/defold/defold/issues/5703) it will be possible to use `lldebugger.lua` from the installed VSCode extension folder.

There is no way to change breakpoints at runtime, only on pauses. Bind some key to call `debugger.requestBreak()` can be a great trick if you want to edit breakpoints at runtime but you don't have any breakpoints in the code at the moment. Watch [tomblind/local-lua-debugger-vscode/#32](https://github.com/tomblind/local-lua-debugger-vscode/issues/32) for updates.

Local Lua Debugger is a *local* debugger. So you can't debug the game on the device by this way.

**Hot reloading** is also available from the Defold Editor. Just select a runned localhost target in the *Project / Target* menu when the game is running.
