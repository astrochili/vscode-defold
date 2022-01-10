---Collection proxy API documentation
---Messages for controlling and interacting with collection proxies
---which are used to dynamically load collections into the runtime.
---@class collectionproxy
collectionproxy = {}
---return an indexed table of missing resources for a collection proxy. Each
---entry is a hexadecimal string that represents the data of the specific
---resource. This representation corresponds with the filename for each
---individual resource that is exported when you bundle an application with
---LiveUpdate functionality. It should be considered good practise to always
---check whether or not there are any missing resources in a collection proxy
---before attempting to load the collection proxy.
---@param collectionproxy url the collectionproxy to check for missing resources.
---@return table the missing resources
function collectionproxy.missing_resources(collectionproxy) end




return collectionproxy