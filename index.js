'use strict';
const ManyKeysMap = require('many-keys-map');
const pDefer = require('p-defer');

const cache = new ManyKeysMap();
const isDomReady = () => document.readyState === 'interactive' || document.readyState === 'complete';

const elementReady = (selector, {
	target = document,
	stopOnDomReady = true,
	timeout = Infinity
} = {}) => {
	const cacheKeys = [target, selector, stopOnDomReady, timeout];
	const cachedPromise = cache.get(cacheKeys);
	if (cachedPromise) {
		return cachedPromise;
	}

	let rafId;
	const deferred = pDefer();
	const {promise} = deferred;

	cache.set(cacheKeys, promise);

	const stop = () => {
		cancelAnimationFrame(rafId);
		cache.delete(cacheKeys, promise);
		deferred.resolve();
	};

	if (timeout !== Infinity) {
		setTimeout(stop, timeout);
	}

	// Interval to keep checking for it to come into the DOM.
	(function check() {
		const element = target.querySelector(selector);

		if (element) {
			deferred.resolve(element);
			stop();
		} else if (stopOnDomReady && isDomReady()) {
			stop();
		} else {
			rafId = requestAnimationFrame(check);
		}
	})();

	return Object.assign(promise, {stop});
};

module.exports = elementReady;
