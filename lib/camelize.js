
/**
 * Converts a string to camelcase
 * @param  {String} s The source string
 * @return {String}   The output string
 */
function camelize(s) {
  var i = 0;
  var o = '';
  while(i < s.length) {
    if(s[i].match(/[ \-_]/)) {
      i += 1;
      o += s[i].toUpperCase();
    } else {
      o += s[i];
    }
    i += 1;
  }
  return o;
};

module.exports = camelize;
