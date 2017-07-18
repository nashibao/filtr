if (!chai) var chai = require('chai');
var should = chai.should();

if (!filtr) var filtr = require('..');
var comparator = filtr.comparators;

describe('comparator', function () {

  it('should have a version', function () {
    filtr.version.should.match(/^\d+\.\d+\.\d+$/);
  });

  it('$gt should work', function () {
    comparator.$gt(1,0).should.be.true;
    comparator.$gt(0,1).should.be.false;
  });

  it('$gte should work', function () {
    comparator.$gte(1,0).should.be.true;
    comparator.$gte(1,1).should.be.true;
    comparator.$gte(0,1).should.be.false;
  });

  it('$lt should work', function () {
    comparator.$lt(0,1).should.be.true;
    comparator.$lt(1,0).should.be.false;

    comparator.$lt(0, 2).should.be.true;
    comparator.$lt(1, 2).should.be.true;
    comparator.$lt(2, 2).should.be.false;
    comparator.$lt(3, 2).should.be.false;
  });

  it('$lte should work', function () {
    comparator.$lte(0,1).should.be.true;
    comparator.$lte(1,1).should.be.true;
    comparator.$lte(1,0).should.be.false;

    comparator.$lte(0, 2).should.be.true;
    comparator.$lte(1, 2).should.be.true;
    comparator.$lte(2, 2).should.be.true;
    comparator.$lte(3, 2).should.be.false;

  });

  it('$regex should work with string regex pattern', function () {
    comparator.$regex('hello world', '^world').should.be.false;
    comparator.$regex('hello world', 'world$').should.be.true;
  });

  it('$all should work', function () {
    comparator.$all([1,2],[1,2]).should.be.true;
    comparator.$all([1], [1,2]).should.be.false;
    comparator.$all([1,2,3],[1,2]).should.be.true;
    comparator.$all(["t1","t2","t3"],["t1"]).should.be.true;
    comparator.$all(["t1","t2","t3"],[/t1/im,/t2/im]).should.be.true;
    comparator.$all(["t1","t2","t3"],[/t4/im]).should.be.false;
  });

  it('"array to array" $eq should work', function () {
    comparator.$eq([1, 2], [1, 2]).should.be.true;
    comparator.$eq([1, 2], [2, 1]).should.be.false;
    comparator.$eq([1, 2], [1]).should.be.false;
    comparator.$eq([1, 2], [1, 2, 3]).should.be.false;
  });

  it('$exists should work', function () {
    var a = undefined
      , b = {c: 'hi', z: 0, n: null};
    comparator.$exists(a, false).should.be.true;
    comparator.$exists(a, true).should.be.false;
    comparator.$exists(b, true).should.be.true;
    comparator.$exists(b.c, false).should.be.false;
    comparator.$exists(b.a, false).should.be.true;
    comparator.$exists('hi', true).should.be.true;
    comparator.$exists(b.z, true).should.be.true;
    comparator.$exists(b.z, false).should.be.false;
    comparator.$exists(b.n, true).should.be.true;
    comparator.$exists(b.n, false).should.be.false;
  });

  it('$mod should work', function () {
    comparator.$mod(12, [12, 0]).should.be.true;
    comparator.$mod(24, [12, 0]).should.be.true;
    comparator.$mod(15, [12, 0]).should.be.false;
  });

  it('$ne should work', function () {
    comparator.$ne(12,12).should.be.false;
    comparator.$ne(12,11).should.be.true;

    comparator.$ne([12],12).should.be.false;
    comparator.$ne([12],11).should.be.true;

    comparator.$ne([1, 12],12).should.be.false;
    comparator.$ne([1, 12],11).should.be.true;

    comparator.$ne(['abc', 'def'],'abc').should.be.false;
    comparator.$ne(['abc', 'def'],'xxx').should.be.true;

    comparator.$ne([1,2],[1,2]).should.be.false;
    comparator.$ne([1,2],[2,1]).should.be.true;
  });

  it('$in should work', function () {
    comparator.$in(1,[0,1,2]).should.be.true;
    comparator.$in(4,[0,1,2]).should.be.false;
    comparator.$in([4],[0,1,2]).should.be.false;
    comparator.$in([0,1,2],[0,1,2]).should.be.true;
    comparator.$in([0,4],[0,1,2]).should.be.true;
  });

  it('$nin should work', function () {
    comparator.$nin(1,[0,1,2]).should.be.false;
    comparator.$nin(4,[0,1,2]).should.be.true;
    comparator.$nin([4],[0,1,2]).should.be.true;
    comparator.$nin([0,1,2],[0,1,2]).should.be.false;
    comparator.$nin([0,4],[0,1,2]).should.be.false;
  });

  it('$size should work', function () {
    comparator.$size([0,1,2], 3).should.be.true;
    comparator.$size('foo', 3).should.be.true;
    comparator.$size({ a: 1}, 1).should.be.false;
    comparator.$size({ length: 3}, 3).should.be.true;
  });

  it('$regex should work', function () {
    comparator.$eq("test", /t..t/im).should.be.true;
    comparator.$eq("test", /test./im).should.be.false;
    comparator.$not("test", /t..t/im).should.be.false;
    comparator.$in("test", [/t..t/im]).should.be.true;
    comparator.$in("abc", [/t..t/im, /ab*c/im]).should.be.true;
    comparator.$in("false", [/t..t/im, /abc/im]).should.be.false;
    comparator.$nin("test", [/t..t/im]).should.be.false;
  });

  it('$or should work', function () {
    var a = [0,1,2]
      , t1 = comparator.$size(a, 2) // fail
      , t2 = comparator.$in(1, a) // pass
      , t3 = comparator.$in(4, a); // fail
    comparator.$or([ t1, t2 ]).should.be.true;
    comparator.$or([ t1, t3 ]).should.be.false;
  });

  it('$nor should work', function () {
    var a = [0,1,2]
      , t1 = comparator.$size(a, 2) // fail
      , t2 = comparator.$in(1, a) // pass
      , t3 = comparator.$in(4, a); // fail
    comparator.$nor([ t1, t2 ]).should.be.false;
    comparator.$nor([ t1, t3 ]).should.be.true;
  });

  it('$and should work', function () {
    var a = [0,1,2]
      , t1 = comparator.$size(a, 3) // pass
      , t2 = comparator.$in(1, a) // pass
      , t3 = comparator.$in(4, a); // fail
    comparator.$and([ t1, t2 ]).should.be.true;
    comparator.$and([ t1, t3 ]).should.be.false;
  });
});
