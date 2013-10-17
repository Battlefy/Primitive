
var traverse = require('./traverse');

/**
 * Accepts a flat object with path keys and
 * creates an hierarchical object from those
 * paths.
 * @param  {Object} flatObject A flat object with
 *                             paths for keys.
 * @return {Object}            A hierarchical
 *                             object.
 */
function arrange(flatObject) {
  var hierarchicalObject = {};
  for(var path in flatObject) {
    var val = flatObject[path];
    traverse(path, hierarchicalObject, val);
  }
  return hierarchicalObject;
};

module.exports = arrange;
