// Stub for deprecated lodash.omit using native JavaScript
// The original package is deprecated - use object destructuring instead

/**
 * Creates an object composed of the own enumerable property paths of object that are not omitted.
 * @param {Object} object - The source object.
 * @param {...(string|string[])} paths - The property paths to omit.
 * @returns {Object} Returns the new object.
 */
function omit(object, ...paths) {
  if (object == null) {
    return {};
  }

  const keysToOmit = new Set(paths.flat());
  const result = {};

  for (const key of Object.keys(object)) {
    if (!keysToOmit.has(key)) {
      result[key] = object[key];
    }
  }

  return result;
}

module.exports = omit;
module.exports.default = omit;
