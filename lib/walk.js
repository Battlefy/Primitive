
/**
 * Walks every property of an object and its
 * children recursively.
 * @param  {Object|Array} data     The subject 
 *                                 object or 
 *                                 array.
 * @param  {Function}     callback A function that
 *                                 will accept 
 *                                 each property.
 */
function walk(data, callback, includeRoot) {
  (function _walk(path, data, include) {
    if(include && typeof callback == 'function') { callback(data, path); }
    path += path && '.' || '';
    var propPath;
    if(typeof data == 'object' && data != null && data.constructor == Array) {
      for(var i = 0; i < data.length; i += 1) {
        _walk(path + i, data[i], true);
      }
    } else if(typeof data == 'object') {
      for(var property in data) {
        _walk(path + property, data[property], true);
      }
    }
  })('', data, includeRoot || false);
}

module.exports = walk;