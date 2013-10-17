
/**
 * Preforms a comparison of two values. If both
 * arguments are objects then a deep compare is
 * preformed and each property is compared
 * recursively.
 *
 * @param  {*}       a First value to be compared
 * @param  {*}       b Second value to be compared
 * @return {Boolean}   True if the the objects
 *                     match, false if not.
 */
function deepCompare(a, b) {

  // if both arguments are the same then
  // return true
  if(a === b) { return true; }

  // return false if:
  // not the same type
  if(typeof a != typeof b) { return false; }

  // an object and
  if(typeof a == 'object') {

    // not the same size
    var ia = 0;
    var ib = 0;
    var property;
    for(property in a) { ia += 1; }
    for(property in b) { ib += 1; }
    if(ia != ib) { return false; }

    // not the same property names
    for(property in a) {
      if(!property in b) { return false; }
    }
    for(property in b) {
      if(!property in a) { return false; }
    }

    // not the same values
    for(property in a) {
      if(!deepCompare(a[property], b[property])) { return false; }
    }

    return true;
  }

  // not the same value
  return false;
}

module.exports = deepCompare;
