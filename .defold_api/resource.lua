---Resource API documentation
---Functions and constants to access resources.
---@class resource
resource = {}
---BASIS_UASTC compression type
resource.COMPRESSION_TYPE_BASIS_UASTC = nil
---COMPRESSION_TYPE_DEFAULT compression type
resource.COMPRESSION_TYPE_DEFAULT = nil
---luminance type texture format
resource.TEXTURE_FORMAT_LUMINANCE = nil
---R16F type texture format
resource.TEXTURE_FORMAT_R16F = nil
---R32F type texture format
resource.TEXTURE_FORMAT_R32F = nil
---RG16F type texture format
resource.TEXTURE_FORMAT_RG16F = nil
---RG32F type texture format
resource.TEXTURE_FORMAT_RG32F = nil
---RGB type texture format
resource.TEXTURE_FORMAT_RGB = nil
---RGB16F type texture format
resource.TEXTURE_FORMAT_RGB16F = nil
---RGB32F type texture format
resource.TEXTURE_FORMAT_RGB32F = nil
---RGBA type texture format
resource.TEXTURE_FORMAT_RGBA = nil
---RGBA16F type texture format
resource.TEXTURE_FORMAT_RGBA16F = nil
---RGBA32F type texture format
resource.TEXTURE_FORMAT_RGBA32F = nil
---RGBA_ASTC_4x4 type texture format
resource.TEXTURE_FORMAT_RGBA_ASTC_4x4 = nil
---RGBA_BC3 type texture format
resource.TEXTURE_FORMAT_RGBA_BC3 = nil
---RGBA_BC7 type texture format
resource.TEXTURE_FORMAT_RGBA_BC7 = nil
---RGBA_ETC2 type texture format
resource.TEXTURE_FORMAT_RGBA_ETC2 = nil
---RGBA_PVRTC_2BPPV1 type texture format
resource.TEXTURE_FORMAT_RGBA_PVRTC_2BPPV1 = nil
---RGBA_PVRTC_4BPPV1 type texture format
resource.TEXTURE_FORMAT_RGBA_PVRTC_4BPPV1 = nil
---RGB_BC1 type texture format
resource.TEXTURE_FORMAT_RGB_BC1 = nil
---RGB_ETC1 type texture format
resource.TEXTURE_FORMAT_RGB_ETC1 = nil
---RGB_PVRTC_2BPPV1 type texture format
resource.TEXTURE_FORMAT_RGB_PVRTC_2BPPV1 = nil
---RGB_PVRTC_4BPPV1 type texture format
resource.TEXTURE_FORMAT_RGB_PVRTC_4BPPV1 = nil
---RG_BC5 type texture format
resource.TEXTURE_FORMAT_RG_BC5 = nil
---R_BC4 type texture format
resource.TEXTURE_FORMAT_R_BC4 = nil
---2D texture type
resource.TEXTURE_TYPE_2D = nil
---2D Array texture type
resource.TEXTURE_TYPE_2D_ARRAY = nil
---Cube map texture type
resource.TEXTURE_TYPE_CUBE_MAP = nil
---Constructor-like function with two purposes:
---
---
--- * Load the specified resource as part of loading the script
---
--- * Return a hash to the run-time version of the resource
---
--- This function can only be called within go.property <> function calls.
---@param path string optional resource path string to the resource
---@return hash a path hash to the binary version of the resource
function resource.atlas(path) end

---Constructor-like function with two purposes:
---
---
--- * Load the specified resource as part of loading the script
---
--- * Return a hash to the run-time version of the resource
---
--- This function can only be called within go.property <> function calls.
---@param path string optional resource path string to the resource
---@return hash a path hash to the binary version of the resource
function resource.buffer(path) end

---This function creates a new atlas resource that can be used in the same way as any atlas created during build time.
---The path used for creating the atlas must be unique, trying to create a resource at a path that is already
---registered will trigger an error. If the intention is to instead modify an existing atlas, use the resource.set_atlas <>
---function. Also note that the path to the new atlas resource must have a '.texturesetc' extension,
---meaning "/path/my_atlas" is not a valid path but "/path/my_atlas.texturesetc" is.
---When creating the atlas, at least one geometry and one animation is required, and an error will be
---raised if these requirements are not met. A reference to the resource will be held by the collection
---that created the resource and will automatically be released when that collection is destroyed.
---Note that releasing a resource essentially means decreasing the reference count of that resource,
---and not necessarily that it will be deleted.
---@param path string The path to the resource.
---@param table table A table containing info about how to create the texture. Supported entries:
---@return hash Returns the atlas resource path
function resource.create_atlas(path, table) end

---This function creates a new buffer resource that can be used in the same way as any buffer created during build time.
---The function requires a valid buffer created from either buffer.create <> or another pre-existing buffer resource.
---By default, the new resource will take ownership of the buffer lua reference, meaning the buffer will not automatically be removed
---when the lua reference to the buffer is garbage collected. This behaviour can be overruled by specifying 'transfer_ownership = false'
---in the argument table. If the new buffer resource is created from a buffer object that is created by another resource,
---the buffer object will be copied and the new resource will effectively own a copy of the buffer instead.
---Note that the path to the new resource must have the '.bufferc' extension, "/path/my_buffer" is not a valid path but "/path/my_buffer.bufferc" is.
---The path must also be unique, attempting to create a buffer with the same name as an existing resource will raise an error.
---@param path string The path to the resource.
---@param table table A table containing info about how to create the buffer. Supported entries:
---@return hash Returns the buffer resource path
function resource.create_buffer(path, table) end

---Creates a new texture resource that can be used in the same way as any texture created during build time.
---The path used for creating the texture must be unique, trying to create a resource at a path that is already
---registered will trigger an error. If the intention is to instead modify an existing texture, use the resource.set_texture <>
---function. Also note that the path to the new texture resource must have a '.texturec' extension,
---meaning "/path/my_texture" is not a valid path but "/path/my_texture.texturec" is.
---@param path string The path to the resource.
---@param table table A table containing info about how to create the texture. Supported entries:
---@param buffer buffer optional buffer of precreated pixel data
---@return hash The path to the resource.
function resource.create_texture(path, table, buffer) end

---Constructor-like function with two purposes:
---
---
--- * Load the specified resource as part of loading the script
---
--- * Return a hash to the run-time version of the resource
---
--- This function can only be called within go.property <> function calls.
---@param path string optional resource path string to the resource
---@return hash a path hash to the binary version of the resource
function resource.font(path) end

---Returns the atlas data for an atlas
---@param path hash|string The path to the atlas resource
---@return table A table with the following entries:
function resource.get_atlas(path) end

---gets the buffer from a resource
---@param path hash|string The path to the resource
---@return buffer The resource buffer
function resource.get_buffer(path) end

---Gets the text metrics from a font
---@param url hash the font to get the (unscaled) metrics from
---@param text string text to measure
---@param options table A table containing parameters for the text. Supported entries:
---@return table a table with the following fields:
function resource.get_text_metrics(url, text, options) end

---Gets texture info from a texture resource path or a texture handle
---@param path hash|string|handle The path to the resource or a texture handle
---@return table A table containing info about the texture:
function resource.get_texture_info(path) end

---Loads the resource data for a specific resource.
---@param path string The path to the resource
---@return buffer Returns the buffer stored on disc
function resource.load(path) end

---Constructor-like function with two purposes:
---
---
--- * Load the specified resource as part of loading the script
---
--- * Return a hash to the run-time version of the resource
---
--- This function can only be called within go.property <> function calls.
---@param path string optional resource path string to the resource
---@return hash a path hash to the binary version of the resource
function resource.material(path) end

---Release a resource.
--- This is a potentially dangerous operation, releasing resources currently being used can cause unexpected behaviour.
---@param path hash|string The path to the resource.
function resource.release(path) end

---Sets the resource data for a specific resource
---@param path string|hash The path to the resource
---@param buffer buffer The buffer of precreated data, suitable for the intended resource type
function resource.set(path, buffer) end

---Sets the data for a specific atlas resource. Setting new atlas data is specified by passing in
---a texture path for the backing texture of the atlas, a list of geometries and a list of animations
---that map to the entries in the geometry list. The geometry entries are represented by three lists:
---vertices, uvs and indices that together represent triangles that are used in other parts of the
---engine to produce render objects from.
---Vertex and uv coordinates for the geometries are expected to be
---in pixel coordinates where 0,0 is the top left corner of the texture.
---There is no automatic padding or margin support when setting custom data,
---which could potentially cause filtering artifacts if used with a material sampler that has linear filtering.
---If that is an issue, you need to calculate padding and margins manually before passing in the geometry data to
---this function.
---@param path hash|string The path to the atlas resource
---@param table table A table containing info about the atlas. Supported entries:
function resource.set_atlas(path, table) end

---sets the buffer of a resource
---@param path hash|string The path to the resource
---@param buffer buffer The resource buffer
function resource.set_buffer(path, buffer) end

---Update internal sound resource (wavc/oggc) with new data
---@param path hash|string The path to the resource
---@param buffer string A lua string containing the binary sound data
function resource.set_sound(path, buffer) end

---Sets the pixel data for a specific texture.
---@param path hash|string The path to the resource
---@param table table A table containing info about the texture. Supported entries:
---@param buffer buffer The buffer of precreated pixel data  To update a cube map texture you need to pass in six times the amount of data via the buffer, since a cube map has six sides!
function resource.set_texture(path, table, buffer) end

---Constructor-like function with two purposes:
---
---
--- * Load the specified resource as part of loading the script
---
--- * Return a hash to the run-time version of the resource
---
--- This function can only be called within go.property <> function calls.
---@param path string optional resource path string to the resource
---@return hash a path hash to the binary version of the resource
function resource.texture(path) end

---Constructor-like function with two purposes:
---
---
--- * Load the specified resource as part of loading the script
---
--- * Return a hash to the run-time version of the resource
---
--- This function can only be called within go.property <> function calls.
---@param path string optional resource path string to the resource
---@return hash a path hash to the binary version of the resource
function resource.tile_source(path) end




return resource