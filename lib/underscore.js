
/**
 * Converts a string to underscore
 * @param  {String} s The source string
 * @return {String}   The output string
 */
function underscore(s) {
  var i = 0;
  var o = '';
  while(i < s.length) {
    if(s[i].match(/[A-Z\d]/)) {
      o += '_' + s[i].toLowerCase();
    } else {
      o += s[i];
    }
    i += 1;
  }
  return o;
};

module.exports = underscore;
