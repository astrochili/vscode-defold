---LiveUpdate API documentation
---Functions and constants to access resources.
---@class liveupdate
liveupdate = {}
---Return a reference to the Manifest that is currently loaded.
---@return number reference to the Manifest that is currently loaded
function liveupdate.get_current_manifest() end

---Is any liveupdate data mounted and currently in use?
---This can be used to determine if a new manifest or zip file should be downloaded.
---@return bool true if a liveupdate archive (any format) has been loaded
function liveupdate.is_using_liveupdate_data() end

---Stores a zip file and uses it for live update content. The contents of the
---zip file will be verified against the manifest to ensure file integrity.
---It is possible to opt out of the resource verification using an option passed
---to this function.
---The path is stored in the (internal) live update location.
---@param path string the path to the original file on disc
---@param callback function(self, status) the callback function executed after the storage has completed
---@param options table optional table with extra parameters. Supported entries:
function liveupdate.store_archive(path, callback, options) end

---Create a new manifest from a buffer. The created manifest is verified
---by ensuring that the manifest was signed using the bundled public/private
---key-pair during the bundle process and that the manifest supports the current
---running engine version. Once the manifest is verified it is stored on device.
---The next time the engine starts (or is rebooted) it will look for the stored
---manifest before loading resources. Storing a new manifest allows the
---developer to update the game, modify existing resources, or add new
---resources to the game through LiveUpdate.
---@param manifest_buffer string the binary data that represents the manifest
---@param callback function(self, status) the callback function executed once the engine has attempted to store the manifest.
function liveupdate.store_manifest(manifest_buffer, callback) end

---add a resource to the data archive and runtime index. The resource will be verified
---internally before being added to the data archive.
---@param manifest_reference number The manifest to check against.
---@param data string The resource data that should be stored.
---@param hexdigest string The expected hash for the resource, retrieved through collectionproxy.missing_resources.
---@param callback function(self, hexdigest, status) The callback function that is executed once the engine has been attempted to store the resource.
function liveupdate.store_resource(manifest_reference, data, hexdigest, callback) end




return liveupdate