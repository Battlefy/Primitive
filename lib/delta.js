
var find = require('./find');
var traverse = require('./traverse');
var del = require('./del');
var deepCompare = require('./deep-compare');
var merge = require('./merge');


function createDelta(path, handledPaths, delta, a, b) {

  // throw errors if a or b is not an object.
  if(typeof path != 'string') {
    throw new Error('path must be an string');
  }
  if(delta === null || typeof delta != 'object') {
    throw new Error('delta must be an object');
  }
  if(delta.$set === null || typeof delta.$set != 'object') {
    throw new Error('delta.$set must be an object');
  }
  if(delta.$unset === null || typeof delta.$unset != 'object') {
    throw new Error('delta.$unset must be an object');
  }

  // compute the types.
  var aType = getDeltaType(a);
  var bType = getDeltaType(b);

  // if the same type
  if(aType == bType) {
    var type = aType;
    var subDelta;

    // if arrays.
    if(type == 'array') {
      createArrayDelta(path, handledPaths, delta, a, b);
    }

    // if object.
    else if(type == 'object') {
      createObjectDelta(path, handledPaths, delta, a, b);
    }

    // if anything else.
    else if(a !== b) {
      traverse(path, delta.$set, b);
    }
  }

  // if b is undefined the unset the value
  else if(b === undefined) {
    traverse(path, delta.$unset, a);
  }

  // otherwise set the value
  else {
    if(path === '') { return b; }
    traverse(path, delta.$set, b);
  }

  // replace unset values with 1
  (function exec(unset) {
    for(var uProp in unset) {
      if(getDeltaType(unset[uProp]) == 'object') { exec(unset[uProp]); }
      else { unset[uProp] = 1; }
    }
  })(delta.$unset);
}

function findDeltaRenames(handledPaths, delta, a, b) {
  if(delta === null || typeof delta != 'object') {
    throw new Error('delta must be an object');
  }
  if(delta.$rename === null || typeof delta.$rename != 'object') {
    throw new Error('delta.$rename must be an object');
  }
  if(a === null || typeof a != 'object') {
    throw new Error('a must be an object');
  }
  if(b === null || typeof b != 'object') {
    throw new Error('b must be an object');
  }

  (function exec(path, target) {
    if(getDeltaType(target) == 'object') {
      for(var prop in target) {
        var subPath = path && path + '.' + prop || prop;
        exec(subPath, target[prop]);
      }
    } else {
      var newPath = find(target, b);
      if(
        newPath && newPath != path &&
        traverse(path, a) != traverse(path, b)
      ) {
        handledPaths.push(path, newPath);
        delta.$rename[path] = newPath;
      }
    }
  })('', a);
}

function createObjectDelta(path, handledPaths, delta, a, b) {

  // throw errors if a or b is not an object.
  if(typeof path != 'string') {
    throw new Error('path must be an string');
  }
  if(handledPaths === null || typeof handledPaths != 'object') {
    throw new Error('handledPaths must be an array');
  }
  if(a === null || typeof a != 'object') {
    throw new Error('a must be an object');
  }
  if(b === null || typeof b != 'object') {
    throw new Error('b must be an object');
  }

  // create delta against a.
  for(var prop in a) {
    var subPath = path && path + '.' + prop || prop;
    for(var i = 0; i < handledPaths.length; i += 1) {
      if(handledPaths[i].substr(0, subPath.length) == subPath) {
        subPath = undefined;
        break;
      }
    }
    if(subPath !== undefined) {
      createDelta(subPath, handledPaths, delta, a[prop], b[prop]);
    }
  }

  // create delta against b.
  for(var prop in b) {
    var subPath = path && path + '.' + prop || prop;
    for(var i = 0; i < handledPaths.length; i += 1) {
      if(handledPaths[i].substr(0, subPath.length) == subPath) {
        subPath = undefined;
        break;
      }
    }
    if(subPath !== undefined) {
      createDelta(subPath, handledPaths, delta, a[prop], b[prop]);
    }
  }
}

function createArrayDelta(path, handledPaths, delta, a, b) {

  if(typeof path != 'string') { throw new Error('path must be an string'); }
  if(delta === null || typeof delta != 'object') {
    throw new Error('delta must be an object');
  }
  if(delta.$push === null || typeof delta.$push != 'object') {
    throw new Error('delta.$push must be an object');
  }
  if(delta.$pull === null || typeof delta.$pull != 'object') {
    throw new Error('delta.$pull must be an object');
  }
  if(typeof a !== 'object' || a.constructor !== Array) {
    throw new Error('a must be an array');
  }
  if(typeof b !== 'object' || b.constructor !== Array) {
    throw new Error('b must be an array');
  }

  // clone the arrays so we can destroy visited
  // indexes
  a = a.slice(0);
  b = b.slice(0);

  // remove all things in both a and b.
  for(var i = 0; i < a.length; i += 1) {
    var aType = getDeltaType(a[i]);
    for(var j = 0; j < b.length; j += 1) {
      var bType = getDeltaType(b[j]);
      var match;
      if(aType == bType && ['object', 'array'].indexOf(aType) > -1) {
        match = deepCompare(a[i], b[j]);
      } else if(aType == bType && aType == 'class') {
        match = a[i] + '' === b[j] + '';
      } else if(a[i] !== undefined) {
        match = a[i] === b[j];
      }
      if(match) {
        a.splice(i, 1); i -= 1;
        b.splice(j, 1); break;
      }
    }
  }

  // note the removals.
  for(var i = 0; i < a.length; i += 1) {
    if(!delta.$pull[path]) { delta.$pull[path] = { $each: [] }; }
    delta.$pull[path].$each.push(a[i]);
  }

  // and additions.
  for(var i = 0; i < b.length; i += 1) {
    if(!delta.$push[path]) { delta.$push[path] = { $each: [] }; }
    delta.$push[path].$each.push(b[i]);
  }

  // note the path as handled.
  handledPaths.push(path);
}

function getDeltaType(val) {
  if(typeof val == 'object') {
    switch(val.constructor) {
      case Array:
        return 'array';
      case Object:
        return 'object';
      default:
        return 'class';
    }
  } else {
    return typeof val;
  }
}

function applyRename(obj, rename) {
  for(var aPath in rename) {
    var bPath = rename[aPath];
    var val = traverse(aPath, obj);
    del(aPath, obj);
    traverse(bPath, obj, val);
  }
}

function applySet(obj, set) {
  (function exec(path, set) {
    for(var prop in set) {
      var subPath = path && path + '.' + prop || prop;
      if(getDeltaType(set[prop]) == 'object') {
        exec(subPath, set[prop]);
      } else {
        traverse(subPath, obj, set[prop]);
      }
    }
  })('', set);
}

function applyUnset(obj, unset) {
  (function exec(path, unset) {
    for(var prop in unset) {
      var subPath = path && path + '.' + prop || prop;
      if(getDeltaType(unset[prop]) == 'object') {
        exec(subPath, unset[prop]);
      } else {
        del(subPath, obj);
      }
    }
  })('', unset);
}

function applyPush(obj, push) {
  (function exec(path, push) {
    for(var prop in push) {
      var subPath = path && path + '.' + prop || prop;
      if(getDeltaType(push[prop]) == 'object') {
        exec(subPath, push[prop]);
      } else if(prop == '$each') {
        var arr = traverse(path, obj);
        for(var i = 0; i < push[prop].length; i += 1) {
          arr.push(push[prop][i]);
        }
      } else {
        var arr = traverse(subPath, obj);
        arr.push(push[prop]);
      }
    }
  })('', push);
}

function applyPull(obj, pull) {
  (function exec(path, pull) {
    for(var prop in pull) {

      var subPath = path && path + '.' + prop || prop;
      if(getDeltaType(pull[prop]) == 'object') {
        exec(subPath, pull[prop]);
      } 

      else if(prop == '$each') {
        var arr = traverse(path, obj);
        for(var i = 0; i < pull[prop].length; i += 1) {
          arr.splice(arr.indexOf(pull[prop][i]), 1);
        }
      }

      else {
        var arr = traverse(subPath, obj);
        arr.splice(arr.indexOf(pull[prop]), 1);
      }
    }
  })('', pull);
}

exports.create = function(a, b) {

  if(a === null || typeof a != 'object') { throw new Error('a must be an object'); }
  if(a === null || typeof b != 'object') { throw new Error('b must be an object'); }

  var delta = {
    $set: {},
    $unset: {},
    $push: {},
    $pull: {},
    $rename: {}
  };
  var handledPaths = [];
  findDeltaRenames(handledPaths, delta, a, b);
  createDelta('', handledPaths, delta, a, b);

  // delete empty delta opts
  for(var opProp in delta) {
    var prop = undefined;
    for(prop in delta[opProp]) { break; }
    if(prop == undefined) { delete delta[opProp]; }
  }

  for(var prop in delta) { break; }
  if(prop == undefined) { return; }
  
  return delta;
};

exports.apply = function(obj, delta) {
  if(obj === null || typeof obj != 'object') {
    throw new Error('obj must be an object');
  }
  if(obj === null || typeof delta != 'object') {
    throw new Error('delta must be an object');
  }
  var obj = merge({}, obj);
  var isDelta = false;
  if(delta.$rename) { isDelta = true; applyRename(obj, delta.$rename); }
  if(delta.$unset) { isDelta = true; applyUnset(obj, delta.$unset); }
  if(delta.$pull) { isDelta = true; applyPull(obj, delta.$pull); }
  if(delta.$set) { isDelta = true; applySet(obj, delta.$set); }
  if(delta.$push) { isDelta = true; applyPush(obj, delta.$push); }
  if(!isDelta) { return delta; }
  return obj;
};


