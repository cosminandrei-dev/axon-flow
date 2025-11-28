// Stub for deprecated lodash.get using native JavaScript
// The original package is deprecated - use optional chaining (?.) instead

/**
 * Gets the value at path of object. If the resolved value is undefined, the defaultValue is returned.
 * @param {Object} object - The object to query.
 * @param {string|Array} path - The path of the property to get.
 * @param {*} [defaultValue] - The value returned for undefined resolved values.
 * @returns {*} Returns the resolved value.
 */
function get(object, path, defaultValue) {
  if (object == null) {
    return defaultValue;
  }

  // Convert string path to array
  const keys = Array.isArray(path)
    ? path
    : path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);

  let result = object;
  for (const key of keys) {
    if (result == null) {
      return defaultValue;
    }
    result = result[key];
  }

  return result === undefined ? defaultValue : result;
}

module.exports = get;
module.exports.default = get;
