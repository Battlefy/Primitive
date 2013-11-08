
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
      '$inc'
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
  original = flatten(original);
  current = flatten(current);

  for(var path in original) {
    var oVal = original[path];
    var cVal = current[path];

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
    delete original[path];
    delete current[path];
  }

  // whatever is left in current become additions.
  for(var path in current) {
    if(!delta.$set) { delta.$set = {}; }
    delta.$set[path] = current[path];
    delete current[path];
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

    // if the unset is still arround then set it
    // to 1 as we don't need to send useless data
    // to the server.
    if(delta.$unset && delta.$unset[uPath] !== undefined) {
      delta.$unset[uPath] = 1;
    }
  }

  // if the delta is empty return undefined.
  for(var ok in delta) { break; }
  if(ok === undefined) { return undefined; }

  // return the delta.
  return delta;
};
