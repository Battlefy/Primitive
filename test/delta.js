
var delta = require('../').delta;

describe('delta.create', function() {

  it('accepts two objects', function() {
    delta.create({}, {});
  });

  it('throws on non objects', function() {
    (function() { delta.create({}, 'a'); }).should.throw();
    (function() { delta.create('a', {}); }).should.throw();
    (function() { delta.create(1, {}); }).should.throw();
    (function() { delta.create(null, {}); }).should.throw();
    (function() { delta.create(undefined, {}); }).should.throw();
    (function() { delta.create({}); }).should.throw();
    (function() { delta.create(); }).should.throw();
  });

  it('returns undefined if the objects are the same', function() {
    var d = delta.create({}, {});
    (d === undefined).should.be.true;
  });

  it('returns an object if the objects are different', function() {
    var d = delta.create({}, { a: true });
    d.should.be.an.a('object');
  });

  it('adds $set to the object when data is added', function() {
    var d = delta.create({}, { a: true });
    d.$set.should.be.an.a('object');
  });

  it('adds the new data and path to $set', function() {
    var d = delta.create({}, { a: { b: 'c' }});
    d.$set['a.b'].should.equal('c');
  });

  it('adds $unset to the object when data is removed', function() {
    var d = delta.create({ a: true }, {});
    d.$unset.should.be.an.a('object');
  });

  it('adds the path to $unset', function() {
    var d = delta.create({ a: { b: 'c' }}, {});
    d.$unset['a.b'].should.equal(1);
  });

  it('adds $rename to the object when data is moved', function() {
    var d = delta.create({ a: true }, { b: true });
    d.$rename.should.be.an.a('object');
  });

  it('adds the new and original path to $rename', function() {
    var d = delta.create({ a: { b: 'c' }}, { a: 'c' });
    d.$rename['a.b'].should.equal('a');
  });

  it('can handle very complex data', function() {
    var d = delta.create({
      a: {
        b: 'a',
        c: 'c',
      },
      z: 'z',
      g: ['i', 'g', 'w']
    }, {
      a: 'a',
      b: 'b',
      x: { y: 'y' },
      g: ['g', 'h']
    });
    d.$unset['a.c'].should.equal(1);
    d.$unset['z'].should.equal(1);
    d.$set['g.0'].should.equal('g');
    d.$set['g.1'].should.equal('h');
    d.$set['b'].should.equal('b');
    d.$set['x.y'].should.equal('y');
    d.$rename['a.b'].should.equal('a');
    d.$pull['g'].should.equal('w');
  });

});

describe('delta.apply', function() {

  before(function() {
    this.data = {
      a: 'a',
      b: 'b',
      e: ['e', 'x'],
      x: 'x'
    };
    this.d = delta.create(this.data, {
      a: 'a',
      b: {
        c: 'c'
      },
      d: {
        e: ['e', 'y']
      }
    });
  });

  it('accepts an object and a diff (object)', function() {
    delta.apply({}, {});
  });

  it('throws on non objects', function() {
    (function() { delta.apply({}, 'a'); }).should.throw();
    (function() { delta.apply('a', {}); }).should.throw();
    (function() { delta.apply(1, {}); }).should.throw();
    (function() { delta.apply(null, {}); }).should.throw();
    (function() { delta.apply(undefined, {}); }).should.throw();
    (function() { delta.apply({}); }).should.throw();
    (function() { delta.apply(); }).should.throw();
  });

  it('returns an object', function() {
    var obj = delta.apply({}, {});
    obj.should.be.a('object');
  });

  it('returns an the diff if it is invalid', function() {
    var d = { a: 'a' };
    var obj = delta.apply({}, d);
    obj.should.equal(d);
  });

  it('adds values to the correct path from $set', function() {
    var obj = delta.apply(this.data, this.d);
    obj.b.c.should.equal('c');
  });

  it('removes paths from $unset', function() {
    var obj = delta.apply(this.data, this.d);
    (obj.x === undefined).should.be.true;
  });

  it('renames paths from $rename', function() {
    var obj = delta.apply(this.data, this.d);
    (obj.e[0] === undefined).should.be.true;
    obj.d.e[0].should.equal('e');
  });

});
