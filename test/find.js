
var find = require('../').find;


describe('find', function() {

  it('returns the path of the target', function() {
    var path = find('ack', {
      ack: 'bar',
      foo: {
        bar: [{
          baz: 'ack'
        }]
      }
    });
    path.should.equal('foo.bar.0.baz');
  });

  it('returns the path of the target', function() {
    var path = find('ack', {
      ack: 'ack',
      foo: {
        bar: [{
          baz: 'ack'
        }, {
          baz: 'ack'
        }]
      }
    }, 2);
    path.should.equal('foo.bar.1.baz');
  });

  it('returns nothing if the target cannot be found', function() {
    (!find('ack', {})).should.be.true;
  });
});