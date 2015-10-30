# pattern-emitter-promise
[![Build Status](https://travis-ci.org/tdzienniak/pattern-emitter-promise.svg?branch=master)](https://travis-ci.org/tdzienniak/pattern-emitter-promise)
Asynchronous (with ES2015 Promises) event emitter supporting regex listeners

## Installation

Just do:
```
npm install pattern-emitter-promise
```
and you are ready.

This lib has no external dependencies.

## Usage

In your code:
```javascript
import EventEmitter from 'event-emitter-promise';

let ee = EventEmitter();

ee.on('fooBar', () => {
    return Promise.resolve('fooBar1');
});

ee.on(/^foo/, (bar) => {
    return Promise.resolve('foo' + bar + '2');
});

ee.on('fooBar', () => {
    return 'fooBar3'; //we support sync return too
});

ee.emit('fooBar', 'Bar').then((results) => {
    results; // ['fooBar1', 'fooBar2', 'fooBar3']
});
```

For more usage examples see [tests](https://github.com/tdzienniak/pattern-emitter-promise/tree/master/test).

## License
MIT
