
function declareFunction(name, constructor) {

  // ensure that the name is free of exploits.
  if(!name.match(/^[a-zA-Z0-9]+$/)) {
    throw new Error('Function name can only contain alphanumeric characters.');
  }

  // create some args so fn.length is set
  // correctly.
  var args = [];
  for(var i = 0; i < constructor.length; i += 1) {
    args.push('a' + i);
  }
  args = args.join(', ');

  // create the function with the help of eval.
  var fn;
  if(args.length > 0) {
    eval('fn = function ' + name + '(' + args + ') { constructor.call(this, ' + args + '); };');
  } else {
    eval('fn = function ' + name + '() { constructor.call(this); };');
  }
  // return the function.
  return fn;
}

module.exports = declareFunction;
