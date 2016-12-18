let localPromise;

try {
    localPromise = Promise;
} catch (e) {}

const EventEmitterPrototype = {
    /**
     * Emits the event.
     *
     * @param  {String} event   event name to emit
     * @param  {Any}    ...args arguments to pass to event listeners
     * @return {Promise}        Promise that will be resolved with array of results from all listeners
     */
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

                try{
                    let currentListenerResult = currentListener.fn(...args);
                }catch(e){
                    return Promise.reject(e);   
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
    /**
     * Adds an event listener function.
     *
     * @param {String|RegExp}   event       event to listen to. Can be either string or regex. In the latter case listener will be invoked when its regex matches emited event name
     * @param {Function}        fn          event listener callback
     * @param {Boolean}         once=false  if `true` listener will be used only once and automatically removed
     * @return {EventEmitter}   EventEmitter instance, may be used for method chaining
     */
    addEventListener (event, fn, once) {
        this._listeners.push({
            fn,
            once,
            event,
            isRegExp: Object.prototype.toString.call(event) === '[object RegExp]'
        })

        return this;
    },
    /**
     * Same as 'addEventListener' but with `once` flag set to `true`.
     *
     * @param  {String|RegExp}  event see `addEventListener`
     * @param  {Function}       fn    see `addEventListener`
     * @return {EventEmitter}         see `addEventListener`
     */
    once (event, fn) {
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
    removeEventListener (event, fn) {
        this._listeners = this._listeners.filter(listener => listener.event !== event || (fn && listener.fn !== fn));

        return this;
    },
    /**
     * Removes all event listeners by name or pattern (see `removeEventListener`).
     *
     * @param  {String|RegExp}  event   event name
     * @return {EventEmitter}           EventEmitter instance
     */
    removeAllListeners (event) {
        return this.removeEventListener(event);
    },
    /**
     * Get listeners associated with event name.
     *
     * @param  {String} event   event name
     * @return {Array}          array of listeners objects with `event`, `fn`, `once` and `isRegExp` properties
     */
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
export const EventEmitter = () => {
    if (!localPromise || Object.prototype.toString.call(localPromise.resolve()) !== '[object Object]' || Object.prototype.toString.call(localPromise.resolve().then) !== '[object Function]') {
        console.warn(
            `Promise is not available in this context. You have to either set Promise
            library with 'setPromiseLibrary' static method or use runtime with built-in
            Promise constructor (newest node.js or any modern browser).`
        );

        return;
    }

    let ee = Object.create(EventEmitterPrototype);

    //instance own property
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
