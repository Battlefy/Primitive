
/**
 * Del accepts a path and traverses into
 * an object, then deletes the end point
 * of the path.
 * @param  {String} path  The path to traverse.
 * @param  {Object} obj   The object to traverse.
 */
function del(path, obj) {
  var pathChunks = path.split('.');
  for(var i = 0; i < pathChunks.length; i += 1) {
    if(obj == undefined) { return; }
    if(i == pathChunks.length - 1) {
      delete obj[pathChunks[i]];
    }
    obj = obj[pathChunks[i]];
  }
};

module.exports = del;
