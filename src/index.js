let localPromise = Promise;

const EventEmitterPrototype = {
    emit (event, ...args) {
        let listeners = this.listeners(event);
        let listenersResults = [];

        if (!listeners.length) {
            return localPromise.resolve(listenersResults);
        }

        return listeners.reduce((prevListenerPromise, currentListener) => {
            if (currentListener.once) {
                this.removeEventListener(currentListener.event, currentListener.fn);
            }

            return prevListenerPromise.then((prevListenerResult) => {
                listenersResults.push(prevListenerResult);

                let currentListenerResult = currentListener.fn(...args);

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
        this._listeners.push({
            fn,
            once,
            event,
            isRegExp: Object.prototype.toString.call(event) === '[object RegExp]'
        })

        return this;
    },
    once (event, listener) {
        return this.addEventListener(event, listener, true);
    },
    removeEventListener (event, fn) {
        this._listeners = this._listeners.filter(listener => listener.event !== event || (fn && listener.fn !== fn));

        return this;
    },
    removeAllListeners (event) {
        return this.removeEventListener(event);
    },
    listeners (event) {
        return this._listeners.filter((listener) => {
            if (listener.isRegExp) {
                return listener.event.test(event);
            } else {
                return listener.event === event;
            }
        });
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
export const EventEmitter = () => {
    if (this instanceof EventEmitter) {
        console.warn(`This is a factory function, it cannot be used with 'new'.`);

        return;
    }

    if (!localPromise || Object.prototype.toString.call(localPromise.resolve()) !== '[object Object]' || Object.prototype.toString.call(localPromise.resolve().then) !== '[object Function]') {
        console.warn(
            `Promise is not available in this context. You have to either set Promise
            library with 'setPromiseLibrary' static method or use runtime with built-in
            Promise constructor (newest node.js or any modern browser).`
        );

        return;
    }

    let ee = Object.create(EventEmitterPrototype);

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
