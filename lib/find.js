

function find(target, obj, offset) {

  offset = offset || 0;

  if(typeof obj != 'object' || obj.constructor !== Object) {
    throw new Error('obj must be an object');
  }
  if(typeof offset != 'number') {
    throw new Error('offset must be a number');
  }

  return (function exec(path, obj) {
    for(var prop in obj) {
      var val = obj[prop];
      var subPath = path && path + '.' + prop || prop;

      // if the val is an object then recurse.
      if(typeof val == 'object') {
        var targetPath = exec(subPath, val);
        if(targetPath) {
          if(offset) { offset -= 1; }
          else { return targetPath; }
        }
      }

      // if the property val matches the target.
      if(val === target) {
        if(offset) { offset -= 1; }
        else { return subPath; }
      }
    }
  })('', obj);
}

module.exports = find;
