if (!chai) var chai = require('chai');
var should = chai.should();

if (!filtr) var filtr = require('..');

describe('Query', function () {
  it('should have a version', function () {
    filtr.version.should.match(/^\d+\.\d+\.\d+$/);
  });

  it('should parse a single query', function () {
    var query = { $lt: 10 }
      , Q = filtr(query);
    Q.stack.should.have.length(1);
    Q.test(8, { type: 'single' }).should.be.true;
    Q.test(11, { type: 'single' }).should.be.false;
  });

  it('should parse a single query 2', function () {
    var query = { $lt: 2 }
      , Q = filtr(query);
    Q.stack.should.have.length(1);
    Q.test(0, { type: 'single' }).should.be.true;
    Q.test(1, { type: 'single' }).should.be.true;
    Q.test(2, { type: 'single' }).should.be.false;
    Q.test(3, { type: 'single' }).should.be.false;
  });


  it('should parse a lengthed query', function () {
    var query = { $lt: 10, $gt: 5 }
      , Q = filtr(query);
    Q.stack.should.have.length(2);
    Q.test(8, { type: 'single' }).should.be.true;
    Q.test(4, { type: 'single' }).should.be.false;
    Q.test(11, { type: 'single' }).should.be.false;
  });

  it('should parse a nested query', function () {
    var query = { $and: [ { $size: 3 }, { $all: [ 1, 2 ] } ] }
      , Q = filtr(query);
    Q.stack.should.have.length(1);
    Q.stack[0].test.should.be.instanceof(Array);
    Q.test([0,1,2], { type: 'single' }).should.be.true;
    Q.test([0,1,2,3], { type: 'single' }).should.be.false;
  });

  it('should parse a complex nested query', function () {
    var query = { $or: [ { $size: 3, $all: [ 4 ] }, { $all: [ 1, 2 ] } ] }
      , Q = filtr(query);
    Q.stack.should.have.length(1);
    Q.test([ 2, 3, 4], { type: 'single' }).should.be.true;
    Q.test([ 1, 2 ], {type: 'single' }).should.be.true;
  });

  it('should support multiple statements', function () {
    var query = { 'test': 'hello', world: { $in: [ 'universe' ] } }
      , Q = filtr(query);
    Q.stack.should.have.length(2);
    Q.test({ test: 'hello', world: 'universe' }, { type: 'single' }).should.be.true;
    Q.test({ test: 'hello', world: 'galaxy' }, { type: 'single' }).should.be.false;
  });

  describe('getPathValue', function () {
    it('can get value for simple nested object', function () {
      var obj = { hello: { universe: 'world' }}
        , val = filtr.getPathValue('hello.universe', obj);
      val.should.equal('world');
    });

    it('can get value for simple array', function () {
      var obj = { hello: [ 'zero', 'one' ] }
        , val = filtr.getPathValue('hello[1]', obj);
      val.should.equal('one');
    });

    it('can get value of nested array', function () {
      var obj = { hello: [ 'zero', [ 'a', 'b' ] ] }
        , val = filtr.getPathValue('hello[1][0]', obj);
      val.should.equal('a');
    });

    it('can get value of array only', function () {
      var obj = [ 'zero', 'one' ]
        , val = filtr.getPathValue('[1]', obj);
      val.should.equal('one');
    });

    it('can get value of array only nested', function () {
      var obj = [ 'zero', [ 'a', 'b' ] ]
        , val = filtr.getPathValue('[1][1]', obj);
      val.should.equal('b');
    });

    it('can get multiple value of embed nested array', function () {
      var obj = { hello: [{ universe: 'world' }, { universe: ['jp'] }]}
        , vals = filtr.getPathValues('hello.universe', obj);
      vals.length.should.equal(2);
      vals[0].should.equal('world');
      vals[1].should.equal('jp');
    });

    it('can get multiple value of embed nested array', function () {
      var obj = { hello: [{ universe: 'world', child1: [{child2: 1}] }]}
        , vals = filtr.getPathValues('hello.child1.child2', obj);
      vals.length.should.equal(1);
      vals[0].should.equal(1);
    });

  });

  describe('setPathValue', function () {
    it('should allow value to be set in simple object', function () {
      var obj = {};
      filtr.setPathValue('hello', 'universe', obj);
      obj.should.eql({ hello: 'universe' });
    });

    it('should allow nested object value to be set', function () {
      var obj = {};
      filtr.setPathValue('hello.universe', 'filtr', obj);
      obj.should.eql({ hello: { universe: 'filtr' }});
    });

    it('should allow nested array value to be set', function () {
      var obj = {};
      filtr.setPathValue('hello.universe[0].filtr', 'galaxy', obj);
      obj.hello.universe[0].filtr.should.eql('galaxy');
      // obj.should.eql({ hello: { universe: [ { filtr: 'galaxy' } ] }});
    });

    it('should allow value to be REset in simple object', function () {
      var obj = { hello: 'world' };
      filtr.setPathValue('hello', 'universe', obj);
      obj.should.eql({ hello: 'universe' });
    });

    it('should allow value to be set in complex object', function () {
      var obj = { hello: { }};
      filtr.setPathValue('hello.universe', 42, obj);
      obj.should.eql({ hello: { universe: 42 }});
    });

    it('should allow value to be REset in complex object', function () {
      var obj = { hello: { universe: 100 }};
      filtr.setPathValue('hello.universe', 42, obj);
      obj.should.eql({ hello: { universe: 42 }});
    });

    it('should allow for value to be set in array', function () {
      var obj = { hello: [] };
      filtr.setPathValue('hello[0]', 1, obj);
      obj.should.eql({ hello: [1] });
      filtr.setPathValue('hello[2]', 3, obj);
      obj.should.eql({ hello: [1 , , 3] });
    });

    it('should allow for value to be REset in array', function () {
      var obj = { hello: [ 1, 2, 4 ] };
      filtr.setPathValue('hello[2]', 3, obj);
      obj.should.eql({ hello: [ 1, 2, 3 ] });
    });
  });

  describe('comparator assumptions', function () {
    it('should assume $eq if no comparator provided - string', function () {
      var query = { 'hello': 'universe' }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ hello: 'universe' }, { type: 'single' }).should.be.true;
    });

    it('should assume $eq if no comparator provided - string("null")', function () {
      var query = { 'hello': 'null' }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ hello: 'null' }, { type: 'single' }).should.be.true;
    });

    it('should assume $eq if no comparator provided - number', function () {
      var query = { 'hello': 42 }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ hello: 42 }, { type: 'single' }).should.be.true;
    });

    it('should assume $eq if no comparator provided - number(0)', function () {
      var query = { 'hello': 0 }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ hello: 0 }, { type: 'single' }).should.be.true;
      Q.test({}, { type: 'single' }).should.be.false;
      Q.test({ hello: null }, { type: 'single' }).should.be.false;
    });

    it('should assume $eq if no comparator provided - null', function () {
      var query = { 'hello': null }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ hello: 0 }, { type: 'single' }).should.be.false;
      Q.test({ hello: null }, { type: 'single' }).should.be.true;

      // https://docs.mongodb.com/v3.2/tutorial/query-for-null-fields/
      Q.test({}, { type: 'single' }).should.be.true;
    });

    it('should assume $eq if no comparator provided - boolean', function () {
      var query = { 'hello': true }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ hello: true }, { type: 'single' }).should.be.true;
    });

    it('should assume $eq if no comparator provide - nested', function () {
      var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ hello: true }, { type: 'single' }).should.be.true;
      Q.test({ universe: true }, { type: 'single' }).should.be.true;
      Q.test({ hello: false, universe: true }, { type: 'single' }).should.be.true;
      Q.test({ hello: false, universe: false }, { type: 'single' }).should.be.false;
    });

    it('should filter embeded array', function () {
      var query = { 'hello.universe.parent': 'filtr' }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ hello: {universe: [{ parent: 'filtr'}]} }, { type: 'single' }).should.be.true;
    });

    it('should filter embeded array', function () {
      var query = { 'hello.universe.parent': 'xxx' }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ hello: {universe: [{ parent: 'filtr'}]} }, { type: 'single' }).should.be.false;
    });

    it('should assume if array to array: 配列の検索', function () {
      var query = { 'arrayField': [ 'abc', 'def', 'ghi'] }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ 'arrayField': ['abc', 'def', 'ghi'] }, { type: 'single' }).should.be.true;
    });

    it('should assume if array to array: 同じ値が重複しているケース', function () {
      var query = { 'arrayField': [ 'abc', 'def', 'ghi'] }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ 'arrayField': ['abc', 'def', 'ghi', 'abc'] }, { type: 'single' }).should.be.false;
    });
    it('should assume if array to array: 並び順が違うケース', function () {
      var query = { 'arrayField': [ 'abc', 'def', 'ghi'] }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ 'arrayField': ['abc', 'ghi', 'def'] }, { type: 'single' }).should.be.false;
    });

    it('should assume $eq if array to array', function () {
      var query = { 'arrayField': { $eq: [ 'abc', 'def', 'ghi'] } }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ 'arrayField': ['abc', 'def', 'ghi'] }, { type: 'single' }).should.be.true;
    });

    it('should not $eq', function () {
      var query = { 'arrayField': [ /abc/im ] }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ 'arrayField': ['abc', 'def', 'ghi'] }, { type: 'single' }).should.be.false;
    });

    it('should not $eq', function () {
      var query = { 'arrayField': [ /abc/im, /def/im, /ghi/im ] }
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ 'arrayField': ['abc', 'def', 'ghi'] }, { type: 'single' }).should.be.false;
    });

    it('should parse an array access query', function () {
      var query = { 'arrayField.0': 'abc' }
          , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({ 'arrayField': ['abc', 'def', 'ghi'] }, { type: 'single' }).should.be.true;
      Q.test({ 'arrayField': ['def', 'abc', 'ghi'] }, { type: 'single' }).should.be.false;

      var query2 = { 'arrayField.1': 'abc' }
          , Q2 = filtr(query2);
      Q2.stack.should.have.length(1);
      Q2.test({ 'arrayField': ['abc', 'def', 'ghi'] }, { type: 'single' }).should.be.false;
      Q2.test({ 'arrayField': ['def', 'abc', 'ghi'] }, { type: 'single' }).should.be.true;
    });

    it('should $ne work', function () {
      var query = {'sets': {$ne: 'Chrome'}}
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({sets: ['Chrome', 'abc']}, {type: 'single'}).should.be.false;
      Q.test({sets: ['Firefox', 'abc']}, {type: 'single'}).should.be.true;
    });

    it('should $eq work', function () {
      var query = {'sets': {$eq: 'Chrome'}}
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({sets: ['Chrome', 'abc']}, {type: 'single'}).should.be.true;
      Q.test({sets: ['Firefox', 'abc']}, {type: 'single'}).should.be.false;
    });

    it('should regexp $ne work', function () {
      var query = {'sets': {$ne: /Chrome/}}
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({sets: ['Chrome', 'abc']}, {type: 'single'}).should.be.false;
      Q.test({sets: ['Firefox', 'abc']}, {type: 'single'}).should.be.true;
    });

    it('should regexp $eq work', function () {
      var query = {'sets': {$eq: /Chrome/}}
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({sets: ['Chrome', 'abc']}, {type: 'single'}).should.be.true;
      Q.test({sets: ['Firefox', 'abc']}, {type: 'single'}).should.be.false;
    });

    it('should regexp $eq work', function () {
      var query = {'sets': /Chrome/}
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({sets: ['Chrome', 'abc']}, {type: 'single'}).should.be.true;
      Q.test({sets: ['Firefox', 'abc']}, {type: 'single'}).should.be.false;
    });

    it('should regexp $eq work appropriately', function () {
      var query = {'test': /f/}
        , Q = filtr(query);
      Q.stack.should.have.length(1);
      Q.test({}, {type: 'single'}).should.be.false;
    });

  });

  // TODO: All nesting options.
});
