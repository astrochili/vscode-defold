# Change Log

All notable changes to the Defold Kit extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.1.9] - 2024-08-11

### Added

- Added missing check for library folder changes at startup [#47](https://github.com/astrochili/vscode-defold/issues/47).

## [2.1.8] - 2024-08-11

### Added

- Added `Lua.runtime.pathStrict: true` with additional fixes for annotation paths so that autocompletion of libraries works.
- Added comparing Defold and annotations versions to sync Defold API automatically. Turned on by default.
- Added watching on the `.internal/libs` folder changes to sync libraries annotations automatically [#45](https://github.com/astrochili/vscode-defold/issues/45). Turned on by default.

### Fixed

- Fixed excessive nesting of annotation folders (`defold_api/defold_api` and `libs_api/extension_v1/extension/...`).

### Removed

- Removed `d954mas/defold-api-emmylua` from the annotation sources because it's almost a year out of date.

## [2.1.7] - 2024-08-05

### Removed

- Removed `Lua.runtime.pathStrict: true` from  the `settings.json` template because of the bad side effect on external libraries autocompletion. Will review it later.

## [2.1.6] - 2024-07-07

### Added

- Added `Lua.runtime.pathStrict': true` to  the `settings.json` template.

### Fixed

- Fixed cleaning outdated and doubled library annotations after deletion or updating the version.
- Fixed cleaning library annotations folder with the `Clean Annotations` command.

### Removed

- Removed `Lua.telemetry.enable` from the `settings.json` template.

## [2.1.5] - 2024-06-12

### Updated

- Improved the snippets a bit.

### Note

- The definition of the `on_input.action` class exists in the updated [defold-annotations](https://github.com/astrochili/defold-annotations/releases) release. So to make `on_input.action` available, please sync [Defold API annotations](https://github.com/astrochili/vscode-defold?tab=readme-ov-file#annotations-syncing) via command pallete.

## [2.1.4] - 2024-06-11

### Added

- Added a `script` snippet with a `self` class definition and annotated lifecycle functions. Useful to create a script file with ready to use `self` annotations. By default, the class is named by filename.
- Added annotations and the `---@package` marker for script lifecycle snippets. The `---@package` allows to hide lifecycle functions from the global context so that you don't get confused when choosing between a snippet and a real declared function with the same name.

## [2.1.3] - 2024-04-10

### Added

- Added YAML files associations [#40](https://github.com/astrochili/vscode-defold/issues/40)

## [2.1.2] - 2024-01-24

### Fixed

- Fixed the libraries API syncing on Windows [#37](https://github.com/astrochili/vscode-defold/issues/37)

## [2.1.1] - 2023-11-11

### Changed

- Optional extensions are now unselected during setup by default. Most people obviously don't need them.

### Fixed

- Fixed confusing false start of an old build, in case of new build error. Now the old build is deleted in this case to avoid accidental launch.

## [2.1.0] - 2023-10-19

### Added

- Added the `Open Defold` command to open the current project in the Defold Editor.

## [2.0.8] - 2023-10-10

### Changed

- Changed the build path to avoid conflicts with the Defold Editor build.

## [2.0.7] - 2023-10-03

### Fixed

- Fixed the soft migration of the workspace launch configuration.

## [2.0.6] - 2023-10-03

### Changed

- Renamed the category of tasks and commands from `Defold` to `Defold Kit` to avoid conflicts.
- Renamed all the settings keys from `defold.` to `defoldKit.` to avoid conflicts.
- Renamed launch configuration to `Defold Kit` to avoid conflicts.

### Added

- Soft migration of user settings from `defold.` to `defoldKit.` keys.
- Soft migration of the workspace launch configuration from `Defold` to `Defold Kit` name.

## [2.0.5] - 2023-09-30

### Removed

- Removed everything related the `Launch (without debugger)` and `Build to Launch` commands to avoid confusing.
- Now the only way to launch the game is using the `Run ang Debug` panel.

## [2.0.4] - 2023-09-30

### Fixed

- Fixed the launch command for a project with spaces in the path.

## [2.0.3] - 2023-09-26

### Added

- Added an additional annotations source to the settings — [d954mas/defold-api-emmylua](https://github.com/d954mas/defold-api-emmylua).

## [2.0.2] - 2023-09-22

### Fixed

- Fixed `dmengine` selection bug for macOS with Intel during preparing for launch.


## [2.0.1] - 2023-09-19

### Fixed

- Unwrapped `require('debugger.debugger’)` calls in the docs and in the `debugger.script`file to avoid problems with Defold code analyser before build

## [2.0.0] - 2023-09-18

- Initial release