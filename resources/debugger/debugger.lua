--[[
  debugger.lua
  github.com/astrochili/vscode-defold
  Copyright (c) 2023 Roman Silin
  MIT license. See LICENSE for details.

  Helpful module to debug the Defold project with Local Lua Debugger in VSCode.
  Require it to your initial script or module and start the debugger session.
  See an example in the `debugger.script` file.
--]]

local dummy = {
  error = ''
}

dummy.start = function()
  print('VSCode debugger hasn\'t started. ' .. dummy.error)
end

if os.getenv('LOCAL_LUA_DEBUGGER_VSCODE') ~= '1' then
  dummy.error = 'Not the VSCode environment or the Local Lua Debugger extension is not installed.'
  return dummy
end

local debugger_path

for path in package.path:gmatch('([^;]+)') do
  if path:find('local%-lua%-debugger') then
    debugger_path = path:gsub('?.lua', 'lldebugger.lua')
  end
end

if not debugger_path then
  dummy.error = 'Path `local-lua-debugger doesn\'t` exist in package.path.'
  return dummy
end

local debugger_file = io.open(debugger_path, 'r')
local is_file_exists = debugger_file ~= nil

if is_file_exists then
  io.close(debugger_file)
else
  dummy.error = 'File doesn\'t exist: ' .. debugger_path
  return dummy
end

local debugger = { }
local module, error = loadfile(debugger_path)

if module then
  package.loaded['lldebugger'] = module()

  local import = require
  debugger = import 'lldebugger'

  return debugger
elseif error then
  dummy.error = 'Loading file error, ' .. error

  return dummy
end