
/**
 * Merge source objects into an existing object.
 * @return {Object} The new merged object
 */
function merge(targetObj    ) {
  var objs = Array.prototype.slice.call(arguments, 1);
  var deppMerge = objs[objs.length - 1] == true;
  if(deppMerge) { objs.pop(); }
  while(objs[0]) {
    var obj = objs.shift();
    if(typeof obj !== 'object') { throw new Error('all arguments must be an object'); }
    for(var key in obj) {
      if(!obj.hasOwnProperty(key)) { continue; }
      if(
        deppMerge && typeof obj[key] == 'object' && (
          typeof targetObj[key] == 'object' ||
          typeof targetObj[key] == undefined
        )) {
        if(typeof targetObj[key] == undefined) {
          targetObj[key] = {};
        }
        merge(targetObj[key], obj[key], true);
      } else {
        targetObj[key] = obj[key];
      }
    }
  }
  return targetObj;
};

module.exports = merge;
