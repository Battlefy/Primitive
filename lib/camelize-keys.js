
var walk = require('./walk');
var camelize = require('./camelize');

function camelizeKeys(data) {
  walk(data, function(data) {
    if(typeof data == 'object' && data != null && typeof data.push != 'function') {
      for(var property in data) {
        var val = data[property];
        delete data[property];
        data[camelize(property)] = val;
      }
    }
  });
};

module.exports = camelizeKeys;