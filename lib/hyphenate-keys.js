
var walk = require('./walk');
var hyphenate = require('./hyphenate');

function hyphenateKeys(data) {
  walk(data, function(data) {
    if(typeof data == 'object' && data != null && typeof data.push != 'function') {
      for(var property in data) {
        var val = data[property];
        delete data[property];
        data[hyphenate(property)] = val;
      }
    }
  });
};

module.exports = hyphenateKeys;
