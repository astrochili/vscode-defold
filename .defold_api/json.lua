--[[
  Generated with github.com/astrochili/defold-annotations
  Defold 1.5.0

  JSON API documentation

  Manipulation of JSON data strings.
--]]

---@diagnostic disable: lowercase-global
---@diagnostic disable: missing-return
---@diagnostic disable: duplicate-doc-param
---@diagnostic disable: duplicate-set-field

---@class json
json = {}

---Represents the null primitive from a json file
json.null = nil

---Decode a string of JSON data into a Lua table.
---A Lua error is raised for syntax errors.
---@param json string json data
---@return table data decoded json
function json.decode(json) end

---Encode a lua table to a JSON string.
---A Lua error is raised for syntax errors.
---@param tbl table lua table to encode
---@return string json encoded json
function json.encode(tbl) end

return json