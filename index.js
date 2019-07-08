'use strict';
const ManyKeysMap = require('many-keys-map');
const domLoaded = require('dom-loaded');
const pDefer = require('p-defer');

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
		(async () => {
			await domLoaded;
			stop();
		})();
	}

	if (timeout !== Infinity) {
		setTimeout(stop, timeout);
	}

	// Interval to keep checking for it to come into the DOM
	(function check() {
		const element = target.querySelector(selector);

		if (element) {
			deferred.resolve(element);
			stop();
		} else {
			rafId = requestAnimationFrame(check);
		}
	})();

	return Object.assign(promise, {stop});
};

elementReady.subscribe = (selector, callback, {
	target = document,
	stopOnDomReady = true,
	timeout = Infinity
} = {}) => {
	const seenElements = new WeakSet();

	let rafId;
	let checkFrame = true;

	const stop = () => {
		cancelAnimationFrame(rafId);
	};

	if (stopOnDomReady) {
		(async () => {
			await domLoaded;
			stop();
		})();
	}

	if (timeout !== Infinity) {
		setTimeout(stop, timeout);
	}

	(function check() {
		if (checkFrame) {
			const allElements = target.querySelectorAll(selector);

			for (const element of allElements) {
				if (seenElements.has(element)) {
					continue;
				}

				callback(element);
				seenElements.add(element);
			}
		}

		rafId = requestAnimationFrame(check);
		checkFrame = !checkFrame;
	})();

	return {stop};
};

module.exports = elementReady;
