
/**
 * Traverse accepts a path and traverses into
 * an object. If a value is given then
 * the end point of the path is set with the
 * given value.
 * @param  {String} path  The path to traverse.
 * @param  {Object} obj   The object to traverse.
 * @param  {*}      value [optional] A value to
 *                        assign to the end point
 *                        of the path.
 * @return {*}            The value at the end
 *                        of the traversal.
 */
function traverse(path, obj, value) {
  var pathChunks = path.split('.');
  for(var i = 0; i < pathChunks.length; i += 1) {
    if(obj == undefined) { return; }
    if(value !== undefined && i == pathChunks.length - 1) {
      obj[pathChunks[i]] = value;
    }
    if(value !== undefined && obj[pathChunks[i]] === undefined) {
      obj[pathChunks[i]] = {};
    } 
    obj = obj[pathChunks[i]];
  }
  return obj;
};

module.exports = traverse;
