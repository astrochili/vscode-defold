local dummy = { }
dummy.error = ''
dummy.start = function()
  print('VSCode debugger hasn\'t started. ' .. dummy.error)
end

if os.getenv('LOCAL_LUA_DEBUGGER_VSCODE') ~= '1' then
  dummy.error = 'This is not the VSCode environment or the lldebugger extension is not installed'
  return dummy
end

local debugger_path

for path in package.path:gmatch('([^;]+)') do
  if path:find('local%-lua%-debugger') then
    debugger_path = path:gsub('?.lua', 'lldebugger.lua')
  end
end

if not debugger_path then
  dummy.error = 'Extension local-lua-debugger doesn\'t exist in package.path.'
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
  local include = require
  debugger = include 'lldebugger'
  return debugger
elseif error then
  dummy.error = 'Loading file error, ' .. error
  return dummy
end

