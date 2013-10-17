
var walk = require('./walk');
var hypenate = require('./hypenate');

function hypenateKeys(data) {
  walk(data, function(data) {
    if(typeof data == 'object' && data != null && typeof data.push != 'function') {
      for(var property in data) {
        var val = data[property];
        delete data[property];
        data[hypenate(property)] = val;
      }
    }
  });
};

module.exports = hypenateKeys;
