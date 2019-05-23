'use strict';
const ManyKeysMap = require('many-keys-map');
const domLoaded = require('dom-loaded');
const pDefer = require('p-defer');

const cache = new ManyKeysMap();
const elementReady = (selector, options) => {
	const {
		target = document,
		stopOnDomReady = true
	} = options;

	const cacheKeys = [target, selector, stopOnDomReady];
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

	if (stopOnDomReady) {
		domLoaded.then(stop);
	}

	// Interval to keep checking for it to come into the DOM
	(function check() {
		const el = target.querySelector(selector);

		if (el) {
			deferred.resolve(el);
			stop();
		} else {
			rafId = requestAnimationFrame(check);
		}
	})();

	return Object.assign(promise, {stop});
};

module.exports = elementReady;
