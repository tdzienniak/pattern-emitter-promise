(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var localPromise = void 0;

try {
  localPromise = Promise;
} catch (e) {
  // noop
}

var EventEmitterPrototype = {
  /**
   * Emits the event.
   *
   * @param  {String} event   event name to emit
   * @param  {Any}    ...args arguments to pass to event listeners
   * @return {Promise}        Promise that will be resolved with array of results from all listeners
   */
  emit: function emit(event) {
    var _this = this;

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var listeners = this.listeners(event);
    var listenersResults = [];

    if (!listeners.length) {
      return localPromise.resolve(listenersResults);
    }

    return listeners.reduce(function (prevListenerPromise, currentListener) {
      if (currentListener.once) {
        _this.removeEventListener(currentListener.event, currentListener.fn);
      }

      return prevListenerPromise.then(function (prevListenerResult) {
        listenersResults.push(prevListenerResult);

        var currentListenerResult = void 0;

        try {
          currentListenerResult = currentListener.fn.apply(currentListener, args);
        } catch (e) {
          return localPromise.reject(e);
        }

        // this code handles synchronous (not returning Promise) and asynchronous listeners
        if ((typeof currentListenerResult === 'undefined' ? 'undefined' : _typeof(currentListenerResult)) === 'object' && typeof currentListenerResult.then === 'function') {
          return currentListenerResult;
        }

        return localPromise.resolve(currentListenerResult);
      });
    }, localPromise.resolve()).then(function (prevListenerResult) {
      listenersResults.push(prevListenerResult);

      // remove first, because it comes from empty resolved Promise used as initial reduce value
      listenersResults.shift();

      return listenersResults;
    });
  },

  /**
   * Adds an event listener function.
   *
   * @param {String|RegExp}   event       event to listen to. Can be either string or regex. In the latter case listener will be invoked when its regex matches emited event name
   * @param {Function}        fn          event listener callback
   * @param {Boolean}         once=false  if `true` listener will be used only once and automatically removed
   * @return {EventEmitter}   EventEmitter instance, may be used for method chaining
   */
  addEventListener: function addEventListener(event, fn, once) {
    this._listeners.push({
      fn: fn,
      once: once,
      event: event,
      isRegExp: Object.prototype.toString.call(event) === '[object RegExp]'
    });

    return this;
  },

  /**
   * Same as 'addEventListener' but with `once` flag set to `true`.
   *
   * @param  {String|RegExp}  event see `addEventListener`
   * @param  {Function}       fn    see `addEventListener`
   * @return {EventEmitter}         see `addEventListener`
   */
  once: function once(event, fn) {
    return this.addEventListener(event, fn, true);
  },

  /**
   * Remove event listener. If only event name is provided, all listeners with that name will be removed.
   * Listeners are tested against event name using strict equality, so to remove event listener added
   * with pattern, one has to provide referance to the regex object used to define that listener (see example).
   *
   * @example
   * let r = /foo/;
   *
   * ee.on(r, () => {});
   *
   * ee.removeEventListener(/foo/); //listener not removed
   * ee.removeEventListener(r); //listener succesfully removed
   *
   * @param  {String|RegExp}  event event name or pattern.
   * @param  {Function}       fn    callback used to define listener
   * @return {EventEmitter}         EventEmitter instance
   */
  removeEventListener: function removeEventListener(event, fn) {
    this._listeners = this._listeners.filter(function (listener) {
      return listener.event !== event || fn && listener.fn !== fn;
    });

    return this;
  },

  /**
   * Removes all event listeners by name or pattern (see `removeEventListener`).
   *
   * @param  {String|RegExp}  event   event name
   * @return {EventEmitter}           EventEmitter instance
   */
  removeAllListeners: function removeAllListeners(event) {
    return this.removeEventListener(event);
  },

  /**
   * Get listeners associated with event name.
   *
   * @param  {String} event   event name
   * @return {Array}          array of listeners objects with `event`, `fn`, `once` and `isRegExp` properties
   */
  listeners: function listeners(event) {
    return this._listeners.filter(function (listener) {
      if (listener.isRegExp) {
        return listener.event.test(event);
      }

      return listener.event === event;
    });
  }
};

/**
 * An alias of `emit`.
 */
EventEmitterPrototype.trigger = EventEmitterPrototype.emit;

/**
 * An alias of `addEventListener`.
 */
EventEmitterPrototype.on = EventEmitterPrototype.addEventListener;

/**
 * An alias of `removeEventListener`.
 */
EventEmitterPrototype.off = EventEmitterPrototype.removeEventListener;

/**
 * This factory function returns new event emitter object.
 *
 * @return {Object} event emitter instance
 */
var EventEmitter = function EventEmitter() {
  if (!localPromise || Object.prototype.toString.call(localPromise.resolve()) !== '[object Object]' || Object.prototype.toString.call(localPromise.resolve().then) !== '[object Function]') {
    throw new Error('Promise is not available in this context. You have to either set Promise\n      library with \'setPromiseLibrary\' static method or use runtime with built-in\n      Promise constructor (newest node.js or any modern browser).');
  }

  var ee = Object.create(EventEmitterPrototype);

  // instance own property
  ee._listeners = [];

  return ee;
};

/**
 * Sets Promise library to be used by event emitters. This function should be invoked before
 * first event emitter object is created. Using this method is not obligatory,
 * you can rely on built-in Promise implementation if such implementation exists
 * (ex. in new node.js runtimes or modern browsers).
 *
 * @example
 * import Promise from 'bluebird';
 * import EventEmitter form 'pattern-emitter-promise';
 * EventEmitter.setPromiseLibrary(Promise);
 *
 * //this event emitter object will be using library set above
 * let ee = EventEmitter();
 *
 * @param  {Promise} promiseLibrary Promise constructor
 */
EventEmitter.setPromiseLibrary = function (promiseLibrary) {
  localPromise = promiseLibrary;
};

/**
 * Checks if provided parameter is event emitter object.
 *
 * @static
 * @param  {Any}    thing   something
 * @return {Boolean}        `true` if `thing` is event emitter from this lib, `false` otherwise
 */
EventEmitter.isEventEmitter = function (thing) {
  return (typeof thing === 'undefined' ? 'undefined' : _typeof(thing)) === 'object' && Object.getPrototypeOf(thing) === EventEmitterPrototype;
};

exports.default = EventEmitter;
exports.EventEmitter = EventEmitter; // for browserify
},{}]},{},[1]);
