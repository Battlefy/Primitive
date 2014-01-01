
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
    var testCases = [
      {},
      { a: 1 },
      { a: { b: 1 }},
      { a: [1] },
      { a: [{ b: 1 }]}
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      (delta.create(testCases[i], testCases[i]) === undefined)
        .should.be.true;
    }
  });

  xit('correctly detects renames', function() {
    var testCases = [
      [{ a: 1 }, { b: 1 }, { a: 'b' }],
      [{ a: { b: 1 }}, { a: { c: 1 }}, { 'a.b': 'a.c' }],
      [{ a: { b: 1 }}, { c: { b: 1 }}, { 'a.b': 'c.b' }],
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      var d = delta.create(testCases[i][0], testCases[i][1]);
      d.$rename.should.eql(testCases[i][2]);
      (d.$set === undefined).should.be.true;
      (d.$unset === undefined).should.be.true;
      (d.$push === undefined).should.be.true;
      (d.$pull === undefined).should.be.true;
    }
  });

  it('correctly detects additions', function() {
    var testCases = [
      [{ a: 1 }, { a: 1, b: 2 }, { b: 2 }],
      [{ a: { b: 1 }}, { a: { b: 1, c: 2 }}, { 'a.c': 2 }],
      [{ a: { b: 1 }}, { a: { b: 1 }, c: 2 }, { c: 2 }],
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      var d = delta.create(testCases[i][0], testCases[i][1]);
      d.$set.should.eql(testCases[i][2]);
      (d.$rename === undefined).should.be.true;
      (d.$unset === undefined).should.be.true;
      (d.$push === undefined).should.be.true;
      (d.$pull === undefined).should.be.true;
    }
  });

  it('correctly detects removals', function() {
    var testCases = [
      [{ a: 1, b: 2 }, { a: 1 }, { b: 1 }],
      [{ a: { b: 1, c: 2 }}, { a: { b: 1 }}, { 'a.c': 1 }],
      [{ a: { b: 1 }, c: 2 }, { a: { b: 1 }}, { c: 1 }],
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      var d = delta.create(testCases[i][0], testCases[i][1]);
      d.$unset.should.eql(testCases[i][2]);
      (d.$rename === undefined).should.be.true;
      (d.$set === undefined).should.be.true;
      (d.$push === undefined).should.be.true;
      (d.$pull === undefined).should.be.true;
    }
  });

  it('correctly detects array additions', function() {
    function Foo() {};
    var f1 = new Foo();
    var f2 = new Foo();
    var testCases = [
      [{ a: [1]}, { a: [1, 1]}, { a: { $each: [1]}}],
      [{ a: [1]}, { a: [1, 2]}, { a: { $each: [2]}}],
      [{ a: [f1]}, { a: [f1, f2]}, { a: { $each: [f2]}}]
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      var d = delta.create(testCases[i][0], testCases[i][1]);
      d.$push.should.eql(testCases[i][2]);
      (d.$rename === undefined).should.be.true;
      (d.$set === undefined).should.be.true;
      (d.$unset === undefined).should.be.true;
      (d.$pull === undefined).should.be.true;
    }
  });

  it('correctly detects array removals', function() {
    function Foo() {};
    var f1 = new Foo();
    var f2 = new Foo();
    var testCases = [
      [{ a: [1, 1]}, { a: [1]}, { a: [1]}],
      [{ a: [1, 2]}, { a: [1]}, { a: [2]}],
      [{ a: [f1, f2]}, { a: [f1]}, { a: [f2]}]
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      var d = delta.create(testCases[i][0], testCases[i][1]);
      d.$pullAll.should.eql(testCases[i][2]);
      (d.$rename === undefined).should.be.true;
      (d.$set === undefined).should.be.true;
      (d.$unset === undefined).should.be.true;
      (d.$push === undefined).should.be.true;
    }
  });
});

describe('delta.apply', function() {

  it('accepts an object and a delta', function() {
    delta.apply({}, {});
  });

  it('returns the delta if it does not contain delta operators', function() {
    var o = {};
    var d = {};
    delta.apply(o, d);
    o.should.eql(d);
  });

  xit('can apply renames', function() {
    var testCases = [
      [{ a: 1 }, { $rename: { a: 'b' } }, { b: 1 }],
      [{ a: { b: 1 }}, { $rename: { 'a.b': 'a.c' }}, { a: { c: 1 }}],
      [{ a: { b: 1 }}, { $rename: { 'a.b': 'c.b' }}, { a: {}, c: { b: 1 }}],
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      var d = delta.apply(testCases[i][0], testCases[i][1]);
      d.should.eql(testCases[i][2]);
    }
  });

  it('can apply additions', function() {
    var testCases = [
      [{}, { $set: { a: 1 } }, { a: 1 }],
      [{ a: 1 }, { $set: { b: 2 } }, { a: 1, b: 2 }],
      [{ a: { b: 1 }}, { $set: { 'a.c': 2 }}, { a: { b: 1, c: 2 }}],
      [{ a: { b: 1 }}, { $set: { c: 2 }}, { a: { b: 1 }, c: 2 }],
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      delta.apply(testCases[i][0], testCases[i][1]);
      testCases[i][0].should.eql(testCases[i][2]);
    }
  });

  it('can apply removals', function() {
    var testCases = [
      [{ a: 1 }, { $unset: { a: 1 } }, {}],
      [{ a: 1, b: 2 }, { $unset: { b: 2 } }, { a: 1 }],
      [{ a: { b: 1, c: 2 }}, { $unset: { 'a.c': 2 }}, { a: { b: 1 }}],
      [{ a: { b: 1 }, c: 2 }, { $unset: { c: 2 }}, { a: { b: 1 }}],
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      delta.apply(testCases[i][0], testCases[i][1]);
      testCases[i][0].should.eql(testCases[i][2]);
    }
  });

  it('can apply array removals', function() {
    var testCases = [
      [{ a: [1] }, { $pull: { a: { $each: [1] }}}, { a: []}],
      [{ a: [1] }, { $pull: { a: 1 }}, { a: []}],
      [{ a: [1, 2] }, { $pull: { a: { $each: [1] }}}, { a: [2]}]
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      delta.apply(testCases[i][0], testCases[i][1]);
      testCases[i][0].should.eql(testCases[i][2]);
    }
  });

  it('can apply array additions', function() {
    var testCases = [
      [{ a: [] }, { $push: { a: { $each: [1] }}}, { a: [1]}],
      [{ a: [] }, { $push: { a: 1 }}, { a: [1]}],
      [{ a: [1] }, { $push: { a: { $each: [2] }}}, { a: [1, 2]}]
    ];

    for(var i = 0; i < testCases.length; i += 1) {
      delta.apply(testCases[i][0], testCases[i][1]);
      testCases[i][0].should.eql(testCases[i][2]);
    }
  });
});
