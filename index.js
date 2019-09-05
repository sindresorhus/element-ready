'use strict';
const ManyKeysMap = require('many-keys-map');
const domLoaded = require('dom-loaded');

const cache = new ManyKeysMap();

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

		if (stopOnDomReady) {
			(async () => {
				await domLoaded;

				const element = target.querySelector(selector);
				if (element) {
					resolve(element);
				}

				stop();
			})();
		}

		if (timeout !== Infinity) {
			setTimeout(stop, timeout);
		}

		// Query the `target` on every frame
		(function check() {
			const element = target.querySelector(selector);

			if (element) {
				resolve(element);
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
