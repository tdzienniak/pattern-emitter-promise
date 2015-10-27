let localPromise = Promise;

const EventEmitterPrototype = {
    emit (event, ...args) {
        let listeners = this._getMatchingListeners(event);
        let listenersResults = [];

        if (!listeners.length) {
            return localPromise.resolve(listenersResults);
        }

        return listeners.reduce((prevListenerPromise, currentListener) => {
            return prevListenerPromise.then((prevListenerResult) => {
                listenersResults.push(prevListenerResult);

                let currentListenerResult = currentListener.fn(...args);

                if (listener.once) {
                    this.removeEventListener(listener.event, listener.fn);
                }

                //this code handles synchronous (not returning Promise) and asynchronous listeners
                if (typeof currentListenerResult === 'object' && typeof currentListenerResult.then === 'function') {
                    return currentListenerResult;
                } else {
                    return localPromise.resolve(currentListenerResult);
                }
            });
        }, localPromise.resolve()).then((prevListenerResult) => {
            listenersResults.push(prevListenerResult);

            //remove first, because it comes from empty resolved Promise used as initial reduce value
            listenersResults.shift();

            return listenersResults;
        });
    },
    addEventListener (event, fn, once) {
        const existingListeners = this._listeners.get(event);
        const listenerObject = {
            fn,
            once,
            event
        };

        if (existingListeners == null) {
            this._listeners.set(event, [listenerObject]);
        } else {
            existingListeners.push(listenerObject);
        }

        return this;
    },
    once (event, listener) {
        return this.addEventListener(event, listener, true);
    },
    removeEventListener (event, fn) {
        if (!fn) {
            this._listeners.set(event, []);
        } else {
            const listeners = this._listeners.get(event);
            const index = listeners.findIndex(listener => listener.fn === fn);

            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }

        return this;
    },
    removeAllListeners (event) {
        return this.removeEventListener(event);
    },
    _getMatchingListeners (event) {
        const matchingListeners = [];

        for (let [pattern, listeners] of this._listeners) {
            let matching = false;

            if (Object.prototype.toString.call(pattern) === '[object RegExp]') {
                matching = pattern.test(event);
            } else {
                matching = pattern === event;
            }

            if (matching) {
                matchingListeners.push(...listeners);
            }
        }

        return matchingListeners;
    }
};

/**
 * Some aliases.
 */
EventEmitterPrototype.trigger = EventEmitterPrototype.emit;
EventEmitterPrototype.on = EventEmitterPrototype.addEventListener;
EventEmitterPrototype.off = EventEmitterPrototype.removeEventListener;

/**
 * This factory function returns new event emitter object.
 *
 * @return {Object} event emitter object
 */
const EventEmitter = () => {
    if (this instanceof EventEmitter) {
        console.warn(`This is a factory function, it cannot be used with 'new'.`);

        return;
    }

    if (!localPromise || Object.prototype.toString.call(localPromise.resolve()) !== '[object Promise]') {
        console.warn(
            `Promise is not available in this context. You have to either set Promise
            library with 'setPromiseLibrary' static method or use runtime with built-in
            Promise constructor (newest node.js or any modern browser).`
        );

        return;
    }

    let ee = Object.create(EventEmitterPrototype);

    ee._listeners = new Map();

    ee._stringListeners = {};
    ee._regexListeners = new Map();

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
EventEmitter.setPromiseLibrary = (promiseLibrary) => {
    localPromise = promiseLibrary;
};

/**
 * Checks if provided parameter is event emitter object.
 *
 * @static
 * @param  {Any}    thing   something
 * @return {Boolean}        `true` if `thing` is event emitter from this lib, `false` otherwise
 */
EventEmitter.isEventEmitter = (thing) => {
    return typeof thing === 'object' && Object.getPrototypeOf(thing) === EventEmitterPrototype;
};
