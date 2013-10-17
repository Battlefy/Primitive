
var declareFunction = require('../lib/declare-function');


describe('declareFunction', function() {

  it('creates a declared function', function() {

    var fn = declareFunction('fn', function() {});
    fn.should.be.a('function');

  });

  it('sets the name correctly', function() {

    var fn = declareFunction('fn', function() {});
    fn.name.should.equal('fn');

  });

  it('passes all arguments to the constructor', function(done) {

    var fn = declareFunction('fn', function(a1) {
      a1.should.equal('val');
      done();
    });
    fn('val');

  });

  it('maps "this" to the created function so we can create classes', function() {

    var Fn = declareFunction('Fn', function(a1) {
      this.val = a1;
    });
    var fn = new Fn('val');
    fn.val.should.equal('val');

  });

  it('blocks the creation of exploits by restricting the function name', function() {

    (function() {
      declareFunction('f1() {}; (function() { throw new Error(\'Hacked\'); })(); function f2', function() {});
    }).should.throw();

  });

});
