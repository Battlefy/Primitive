
/**
 * Converts a string to hyphens
 * @param  {String} s The source string
 * @return {String}   The output string
 */
function hypenate(s) {
  var i = 0;
  var o = '';
  while(i < s.length) {
    if(s[i].match(/[A-Z]/)) {
      o += '-' + s[i].toLowerCase();
    } else if(s[i].match(/[ _]/)) {
      o += '-';
    } else {
      o += s[i];
    }
    i += 1;
  }
  return o;
};

module.exports = hypenate;