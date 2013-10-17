
/**
 * Flattens a hierarchical object. Keys become
 * paths.
 * @param  {Object} hierarchicalObject An
 *                                     hierarchical
 *                                     object.
 * @return {Object}                    A flat
 *                                     object.
 */
function flatten(hierarchicalObject) {
  var flatObject = {};
  (function exec(basePath, obj) {
    for(var property in obj) {
      var path = (basePath && basePath + '.' || '') + property;
      if(typeof obj[property] == 'object') {
        exec(path, obj[property]);
      } else {
        flatObject[path] = obj[property];
      }
    }
  })('', hierarchicalObject);
  return flatObject;
};

module.exports = flatten;
