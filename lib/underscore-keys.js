
var walk = require('./walk');
var underscore = require('./underscore');

function underscoreKeys(data) {
  walk(data, function(data) {
    if(typeof data == 'object' && data != null && typeof data.push != 'function') {
      for(var property in data) {
        var val = data[property];
        delete data[property];
        data[underscore(property)] = val;
      }
    }
  });
};

module.exports = underscoreKeys;
