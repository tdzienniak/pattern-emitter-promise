# pattern-emitter-promise
[![Build Status](https://travis-ci.org/tdzienniak/pattern-emitter-promise.svg?branch=master)](https://travis-ci.org/tdzienniak/pattern-emitter-promise)
[![npm version](https://badge.fury.io/js/pattern-emitter-promise.svg)](https://badge.fury.io/js/pattern-emitter-promise)

Asynchronous (using ES2015 Promises) event emitter supporting regex listeners

## Installation

Just do:
```
npm install pattern-emitter-promise
```
and you are ready.

This lib has no external dependencies. Library should be used in environment with Promise global constructor. If there is no such constructor (node 0.10 and earlier or some older browsers), Promise library must be set before first instantiation using `setPromiseLibrary` static method.

## Usage

In your code:
```javascript
import { EventEmitter } from 'event-emitter-promise';

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

For more usage examples see [tests](https://github.com/tdzienniak/pattern-emitter-promise/tree/master/test) and read docs in the [code](https://github.com/tdzienniak/pattern-emitter-promise/tree/master/src/index.js).

## License
MIT
