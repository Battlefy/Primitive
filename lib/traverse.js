
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

    // stop if the cursor is undefined
    if(obj == undefined) { return; }

    // if we are setting a value...
    if(value !== undefined) {

      // set the value if the cursor is at the end
      // of the path.
      if(i == pathChunks.length - 1) {
        obj[pathChunks[i]] = value;
      }

      // if the object does not have the current
      // path chunk create it.
      else if(obj[pathChunks[i]] === undefined) {

        // if the next chunk looks like an array
        // key then create an array.
        if(pathChunks[i + 1] == parseFloat(pathChunks[i + 1])) {
          obj[pathChunks[i]] = [];
        }

        // otherwise create an object.
        else { obj[pathChunks[i]] = {}; }
      }
    }

    // move the cursor down the path
    obj = obj[pathChunks[i]];


  }
  return obj;
};

module.exports = traverse;
