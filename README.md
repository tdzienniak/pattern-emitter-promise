# pattern-emitter-promise
Asynchronous pattern emitter using Promises

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
var EventEmitter = require('event-emitter-promise');
var ee = EventEmitter();

ee.on('fooBar', () => {
    return Promise.resolve('fooBar1')
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

For more usage examples see tests.

## License
MIT
