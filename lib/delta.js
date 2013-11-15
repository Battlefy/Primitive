
var walk = require('./walk');
var flatten = require('./flatten');
var traverse = require('./traverse');
var del = require('./del');
var deepCompare = require('./deep-compare');

exports.apply = function(data, delta) {

  // throw on non objects.
  if(
    !data || typeof data !== 'object' ||
    !delta || typeof delta !== 'object'
  ) {
    throw new Error('Both arguments must be objects.');
  }

  // ensure this is a proper diff, if not simply
  // return the diff.
  for(var prop in delta) {
    if([
      '$set',
      '$setOnInsert',
      '$unset',
      '$rename',
      '$inc',
      '$push',
      '$pull'
    ].indexOf(prop) < 0) {
      return delta;
    }
  }

  // unset.
  if(delta.$unset) {
    var unset = delta.$unset;
    for(var path in unset) {
      del(path, data);
    }
  }

  // pull.
  if(delta.$pull) {
    var pull = delta.$pull;
    for(var path in pull) {
      var arr = traverse(path, data);
      if(pull[path].$each) {
        for(var i = 0; i < pull[path].$each.length; i += 1) {
          arr.splice(arr.indexOf(pull[path].$each[i]), 1);
        }
      } else {
        arr.splice(arr.indexOf(pull[path]), 1);
      }
    }
  }

  // pull.
  if(delta.$push) {
    var push = delta.$push;
    for(var path in push) {
      var arr = traverse(path, data);
      if(push[path].$each) {
        for(var i = 0; i < push[path].$each.length; i += 1) {
          arr.push(push[path].$each[i]);
        }
      } else {
        arr.push(push[path]);
      }
    }
  }

  // rename.
  if(delta.$rename) {
    var rename = delta.$rename;
    for(var path in rename) {
      var val = traverse(path, data);
      del(path, data);
      traverse(rename[path], data, val);
    }
  }

  // set on insert.
  if(delta.$setOnInsert) {
    var setOnInsert = delta.$setOnInsert;
    for(var path in setOnInsert) {
      if(traverse(path, data) === undefined) {
        traverse(path, data, setOnInsert[path]);
      }
    }
  }

  // set.
  if(delta.$set) {
    var set = delta.$set;
    for(var path in set) {
      traverse(path, data, set[path]);
    }
  }

  // inc.
  if(delta.$inc) {
    var inc = delta.$inc;
    for(var path in inc) {
      var val = traverse(path, data) + inc[path];
      traverse(path, data, val);
    }
  }

  // return the new data.
  return data;
};

exports.create = function(original, current) {

  // throw on non objects.
  if(
    !original || typeof original !== 'object' ||
    !current || typeof current !== 'object'
  ) {
    throw new Error('Both arguments must be objects.');
  }

  var delta = { $unset: {}, $set: {}, $push: {}, $pull: {}, $rename: {} };
  var arrayPaths = [];
  var handledPaths = [];

  // walk through the original.
  walk(original, function(oVal, path) {
    var cVal = traverse(path, current);

    // if the current path points to an array in
    // both the original object and the current
    // then look for array diffs
    if(
      typeof cVal == 'object' && typeof oVal == 'object' &&
      cVal.constructor == Array && oVal.constructor == Array
    ) {
      var oRArr = oVal;
      var cRArr = cVal;
      var oArr = oRArr.slice(0);
      var cArr = cRArr.slice(0);

      // loop through the original array
      while(oArr.length > 0) {
        oVal = oArr.shift();

        // look for the oVal within the current
        // array.
        for(var i = 0; i < cRArr.length; i += 1) {
          cVal = cRArr[i];

          // if the oVal and cVal are in both
          // arrays, then move on.
          if(deepCompare(oVal, cVal)) { oVal = undefined; break; }
        }

        // if the oVal is no longer in the current
        // array, then it has been removed.
        if(oVal) {
          if(!delta.$pull) { delta.$pull = {}; }
          if(!delta.$pull[path]) { delta.$pull[path] = {}; }
          if(!delta.$pull[path].$each) { delta.$pull[path].$each = []; }
          delta.$pull[path].$each.push(oVal);
        }
      }

      // loop through the current array
      while(cArr.length > 0) {
        cVal = cArr.shift();

        // look for the cVal within the original
        // array.
        for(var i = 0; i < oRArr.length; i += 1) {
          oVal = oRArr[i];

          // if the oVal and cVal are in both
          // arrays, then move on.
          if(deepCompare(oVal, cVal)) { cVal = undefined; break; }
        }

        // if the cVal is not in the original
        // array, then it has been added.
        if(cVal) {
          if(!delta.$push) { delta.$push = {}; }
          if(!delta.$push[path]) { delta.$push[path] = {}; }
          if(!delta.$push[path].$each) { delta.$push[path].$each = []; }
          delta.$push[path].$each.push(cVal);
        }
      }

      handledPaths.push(path);
    }

    // if both the current and the original
    // value at the current path are both objects,
    // or they are the same value, then do
    // nothing.
    if(
      typeof cVal == 'object' && typeof oVal == 'object' || 
      cVal === oVal
    ) {
      return;
    }

    // if the path is a decendent of a handled
    // path, then do nothing.
    for(var i = 0; i < handledPaths.length; i += 1) {
      if(path.slice(0, handledPaths[i].length) == handledPaths[i]) {
        return;
      }
    }

    // if the path is a decendent of an array
    // path, then do nothing.
    for(var i = 0; i < arrayPaths.length; i += 1) {
      if(path.slice(0, arrayPaths[i].length) == arrayPaths[i]) {
        return;
      }
    }

    // If oVal is defined and cVal is not then
    // a deletion has occured. Save the original
    // value temporarity so we can track renames.
    if(cVal === undefined) {
      if(!delta.$unset) { delta.$unset = {}; }
      delta.$unset[path] = oVal;
      handledPaths.push(path);
    }

    // if oVal does not equal cVal then note an
    // addition was made.
    else {
      if(!delta.$set) { delta.$set = {}; }
      delta.$set[path] = cVal;
      handledPaths.push(path);
    }

  });

  // walk through the current
  walk(current, function(cVal, path) {
    var oVal = traverse(path, original);

    // if both the current and the original
    // value at the current path are both objects,
    // or they are equal then do nothing.
    if(typeof cVal == typeof oVal == 'object' || cVal == oVal) {
      return;
    }

    // if the path is a decendent of a handled
    // path, then do nothing.
    for(var i = 0; i < handledPaths.length; i += 1) {
      var handledPath = handledPaths[i];
      if(path.slice(0, handledPath.length) == handledPath) {
        return;
      }
    }

    // if the oVal is undefined then an addition
    // was made.
    if(oVal === undefined) {
      if(!delta.$set) { delta.$set = {}; }
      delta.$set[path] = cVal;
      handledPaths.push(path);
    }
  });

  // look for renames.
  walk(delta.$unset, function(uVal, uPath) {
    if(typeof uVal == 'object') { return; }

    walk(delta.$set, function(sVal, sPath) {
      if(typeof sVal == 'object') { return; }

      // if the values match, assume a rename.
      if(uVal == sVal) {
        if(!delta.$rename) { delta.$rename = {}; }
        delta.$rename[uPath] = sPath;
        del(uPath, delta.$unset);
        del(sPath, delta.$set);
      }
    });
  });

  // replace all unset values with 1.
  walk(delta.$unset, function(cVal, uPath) {
    if(typeof cVal == 'object') { return; }
    traverse(uPath, delta.$unset, 1);
  });

  // delete set if its empty
  for(var ok in delta.$set) { break; }
  if(ok === undefined) { delete delta.$set; }
  else { ok = undefined; }

  // delete unset if its empty
  for(var ok in delta.$unset) { break; }
  if(ok === undefined) { delete delta.$unset; }
  else { ok = undefined; }

  // delete push if its empty
  for(var ok in delta.$push) { break; }
  if(ok === undefined) { delete delta.$push; }
  else { ok = undefined; }

  // delete pull if its empty
  for(var ok in delta.$pull) { break; }
  if(ok === undefined) { delete delta.$pull; }
  else { ok = undefined; }

  // delete rename if its empty
  for(var ok in delta.$rename) { break; }
  if(ok === undefined) { delete delta.$rename; }
  else { ok = undefined; }

  // if the delta is empty return undefined.
  for(var ok in delta) { break; }
  if(ok === undefined) { return undefined; }

  // return the delta.
  return delta;
};
