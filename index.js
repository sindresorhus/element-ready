'use strict';
const ManyKeysMap = require('many-keys-map');

const cache = new ManyKeysMap();

const isDomReady = () => {
	return document.readyState === 'interactive' || document.readyState === 'complete';
};

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

	let resolve;
	const promise = new Promise(r => { // eslint-disable-line promise/param-names
		resolve = r;
	});
	cache.set(cacheKeys, promise);

	let rafId;
	const stop = () => {
		cancelAnimationFrame(rafId);
		cache.delete(cacheKeys, promise);
		resolve();
	};

	if (timeout !== Infinity) {
		setTimeout(stop, timeout);
	}

	// Query the `target` on every frame
	(function check() {
		const element = target.querySelector(selector);

		if (element) {
			resolve(element);
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
