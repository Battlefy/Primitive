
/**
 * Create a new merged object from one or more
 * source objects.
 *
 * @return {Object} The new merged object
 */
function extend(    ) {
  var objs = Array.prototype.slice.call(arguments);
  var newObj = objs[0] instanceof Array ? [] : {};
  var deepCopy = objs[objs.length - 1] == true;
  if(deepCopy) { objs.pop(); }
  while(objs[0]) {
    var obj = objs.shift();
    if(typeof obj !== 'object') { throw new Error('all arguments must be an object'); }
    for(var key in obj) {
      if(!obj.hasOwnProperty(key)) { continue; }
      if(deepCopy && typeof obj[key] == 'object') {
        newObj[key] = extend(obj[key], true);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  return newObj;
};

module.exports = extend;
