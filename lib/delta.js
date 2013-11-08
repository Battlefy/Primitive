
var flatten = require('./flatten');
var traverse = require('./traverse');
var del = require('./del');

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
      '$pull'
    ].indexOf(prop) < 0) {
      return delta;
    }
  }

  // unset.
  if(delta.$unset) {
    var unset = flatten(delta.$unset);
    for(var path in unset) {
      del(path, data);
    }
  }

  // pull.
  if(delta.$pull) {
    var pull = flatten(delta.$pull);
    for(var path in pull) {
      var arr = traverse(path, data);
      arr.splice(arr.indexOf(pull[path]), 1);
    }
  }

  // rename.
  if(delta.$rename) {
    var rename = flatten(delta.$rename);
    for(var path in rename) {
      var val = traverse(path, data);
      del(path, data);
      traverse(rename[path], data, val);
    }
  }

  // set on insert.
  if(delta.$setOnInsert) {
    var setOnInsert = flatten(delta.$setOnInsert);
    for(var path in setOnInsert) {
      if(traverse(path, data) === undefined) {
        traverse(path, data, setOnInsert[path]);
      }
    }
  }

  // set.
  if(delta.$set) {
    var set = flatten(delta.$set);
    for(var path in set) {
      traverse(path, data, set[path]);
    }
  }

  // inc.
  if(delta.$inc) {
    var inc = flatten(delta.$inc);
    for(var path in inc) {
      var val = traverse(path, data) + inc[path];
      traverse(path, data, val);
    }
  }

  // return the new data.
  return data;
};

exports.create = function(original, current) {
  var delta = {};

  // throw on non objects.
  if(
    !original || typeof original !== 'object' ||
    !current || typeof current !== 'object'
  ) {
    throw new Error('Both arguments must be objects.');
  }

  // flatten the data.
  var o = flatten(original);
  var c = flatten(current);

  // compare the original object to the new
  // one.
  for(var path in o) {
    var oVal = o[path];
    var cVal = c[path];

    // removals.
    if(cVal === undefined) {
      if(!delta.$unset) { delta.$unset = {}; }
      delta.$unset[path] = oVal;
    }

    // additions.
    else if(cVal !== oVal) {
      if(!delta.$set) { delta.$set = {}; }
      delta.$set[path] = cVal;
    }

    // remove the path.
    delete o[path];
    delete c[path];
  }

  // whatever is left in c become additions.
  for(var path in c) {
    if(!delta.$set) { delta.$set = {}; }
    delta.$set[path] = c[path];
    delete c[path];
  }

  // look for renames.
  for(var uPath in delta.$unset) {
    var uVal = delta.$unset[uPath];
    for(var sPath in delta.$set) {
      var sVal = delta.$set[sPath];

      // if the values match, assume a rename.
      if(uVal == sVal) {
        if(!delta.$rename) { delta.$rename = {}; }
        delta.$rename[uPath] = sPath;
        delete delta.$unset[uPath];
        delete delta.$set[sPath];

        // delete the delta.$unset and/or
        // delta.$set objects if they are empty.
        for(var ok in delta.$unset) { break; }
        if(ok === undefined) { delete delta.$unset; }
        else { ok = undefined; }
        for(var ok in delta.$set) { break; }
        if(ok === undefined) { delete delta.$set; }
        else { ok = undefined; }
      }
    }
  }

  // replace array unsets with $pull commands
  if(delta.$unset) {
    for(var uPath in delta.$unset) {

      // get the path chunks and check for index
      // property denoting existance of an array.
      var uPathChunks = uPath.split('.');
      var prop = uPathChunks.pop();
      if((prop|0) != prop) { continue; }
      var aPath = uPathChunks.join('.');

      // convert all paths to the same array to
      // pull commands.
      for(var uPath in delta.$unset) {
        if(uPath.slice(0, aPath.length) != aPath) { continue; }
        if(!delta.$pull) { delta.$pull = {}; }
        delta.$pull[aPath] = delta.$unset[uPath];
        delete delta.$unset[uPath];

        // delete $unset if its empty
        for(var ok in delta.$unset) { break; }
        if(ok === undefined) { delete delta.$unset; }
        else { ok = undefined; }
      }
    }
  }

  // set the value of unset commands to 1
  if(delta.$unset) {
    for(var uPath in delta.$unset) {
      delta.$unset[uPath] = 1;
    }
  }

  // if the delta is empty return undefined.
  for(var ok in delta) { break; }
  if(ok === undefined) { return undefined; }

  // return the delta.
  return delta;
};
