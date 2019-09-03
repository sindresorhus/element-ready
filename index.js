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

	let stop;
	const promise = new Promise(resolve => {
		let rafId;
		stop = () => {
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
	});

	cache.set(cacheKeys, promise);
	return Object.assign(promise, {stop});
};

module.exports = elementReady;
