import test from 'tape';
import bluebird from 'bluebird';
import { EventEmitter } from '../src';

test('EventEmitter is using custom Promise lib set by user.', (t) => {
  EventEmitter.setPromiseLibrary(bluebird);

  const e = EventEmitter();

  t.ok(e.emit('foo') instanceof bluebird, 'EventEmitter should use user set Promise library');

  t.end();
});

test('EventEmitter instance is corretly identified by static isEventEmitter method.', (t) => {
  const e = EventEmitter();

  t.ok(EventEmitter.isEventEmitter(e), 'isEventEmitter should recognize EventEmitter instance');

  t.end();
});

test('Only sync listeners.', (t) => {
  const e = EventEmitter();

  e.on('foo', () => 'a');

  e.on(/foo/, () => 'b');

  e.on('foo', () => 'c');

  e.on(/^f/, () => 'd');

  e.emit('foo').then((results) => {
    t.equal(results.join(''), 'abcd', 'all listeners should return their values');
    t.end();
  }).catch((err) => {
    t.error(err);
    t.end();
  });
});

test('Only async listeners.', (t) => {
  const e = EventEmitter();

  e.on('foo', () => Promise.resolve('a'));

  e.on(/foo/, () => Promise.resolve('b'));

  e.on('foo', () => Promise.resolve('c'));

  e.on(/^f/, () => Promise.resolve('d'));

  e.emit('foo').then((results) => {
    t.equal(results.join(''), 'abcd', 'all listeners should return their values');
    t.end();
  }).catch((err) => {
    t.error(err);
    t.end();
  });
});

test('Mix sync and async listeners.', (t) => {
  const e = EventEmitter();

  e.on('foo', () => Promise.resolve('a'));

  e.on(/foo/, () => 'b');

  e.on('foo', () => 'c');

  e.on(/^f/, () => Promise.resolve('d'));

  e.emit('foo').then((results) => {
    t.equal(results.join(''), 'abcd', 'all listeners should return their values');
    t.end();
  }).catch((err) => {
    t.error(err);
    t.end();
  });
});

test('Emit with no listeners.', (t) => {
  const e = EventEmitter();

  e.emit('foo').then((result) => {
    t.ok(Array.isArray(result), 'result should be array');
    t.equal(result.length, 0, 'emit event without listeners should resolve with empty array');
    t.end();
  }).catch((err) => {
    t.error(err);
    t.end();
  });
});

test('Emit is correctly passing arguments to listeners.', (t) => {
  const e = EventEmitter();

  e.on('foo', (bar, baz) => ({
    bar,
    baz,
  }));

  e.emit('foo', 'bar', 'baz').then((results) => {
    const result = results[0];

    t.equal(result.bar + result.baz, 'barbaz', 'emit should pass additional arguments to its listenes');
    t.end();
  }).catch((err) => {
    t.error(err);
    t.end();
  });
});

test('EventEmitter#once method (sync).', (t) => {
  let calls = 0;
  const expectedResult = 'bar';

  const e = EventEmitter();

  e.once('foo', () => {
    calls += 1;

    return 'bar';
  });

  return Promise.all([
    e.emit('foo'),
    e.emit('foo'),
    e.emit('foo'),
    e.emit('foo'),
    e.emit('foo'),
  ]).then((results) => {
    t.equal(results[0][0], expectedResult, `result should be equal ${expectedResult}, got ${results[0][0]}`);
    t.equal(calls, 1, 'listener should be called only once');
    t.end();
  }).catch((err) => {
    t.error(err);
    t.end();
  });
});


test('EventEmitter#once method (async).', (t) => {
  let calls = 0;
  const expectedResult = 'bar';

  const e = EventEmitter();

  e.once('foo', () => {
    calls += 1;

    return Promise.resolve('bar');
  });

  Promise.all([
    e.emit('foo'),
    e.emit('foo'),
    e.emit('foo'),
    e.emit('foo'),
    e.emit('foo'),
  ]).then((results) => {
    t.equal(results[0][0], expectedResult, `result should be equal ${expectedResult}, got ${results[0][0]}`);
    t.equal(calls, 1, 'listener should be called only once');
    t.end();
  }).catch((err) => {
    t.error(err);
    t.end();
  });
});

test('EventEmitter#listeners method.', (t) => {
  const e = EventEmitter();

  e.on('foo', () => {});
  e.on('foo', () => {});
  e.on('foobar', () => {});

  t.equal(e.listeners('foo').length, 2, 'should return array with listeners by event');
  t.end();
});

test('Remove event listener.', (t) => {
  const e = EventEmitter();

  const fn = () => {};

  e.on('foo', () => {});
  e.on('foo', fn);
  e.on('foobar', () => {});

  e.removeEventListener('foo', fn);

  t.equal(e.listeners('foo').length, 1, 'should return array with listeners by event');
  t.end();
});

test('Remove all event listeners (string).', (t) => {
  const e = EventEmitter();

  e.on('foo', () => {});
  e.on('foo', () => {});
  e.on('foobar', () => {});

  e.removeAllListeners('foo');

  t.equal(e.listeners('foo').length, 0, 'should return empty array');
  t.end();
});

test('Remove all event listeners (RegExp).', (t) => {
  const e = EventEmitter();
  const r = /foo/;

  e.on(/foo/, () => {});
  e.on(r, () => {});
  e.on(r, () => {});

  t.equal(e.listeners('foo').length, 3, 'should return array with added listeners');

  e.removeAllListeners(r);

  t.equal(e.listeners('foo').length, 1, 'should return array with remaining listeners after removal');
  t.end();
});

test('Sync error in listener.', (t) => {
  const e = EventEmitter();

  const err = new Error();

  e.on('foo', () => {
    throw err;
  });

  e.emit('foo').catch((expectedErr) => {
    t.equal(expectedErr, err, 'should reject if sync error was thrown');
  }).then(() => t.end());
});
