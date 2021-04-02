---Label API documentation
---Functions to manipulate a label component.
---@class label
label = {}
---Gets the text from a label component
---@param url string|hash|url the label to get the text from
---@return string the label text
function label.get_text(url) end

---Gets the text metrics from a label component
---@param url string|hash|url the label to get the (unscaled) metrics from
---@return table a table with the following fields:
function label.get_text_metrics(url) end

---Sets the text of a label component
--- This method uses the message passing that means the value will be set after dispatch messages step.
---More information is available in the Application Lifecycle manual <>.
---@param url string|hash|url the label that should have a constant set
---@param text string the text
function label.set_text(url, text) end




return label