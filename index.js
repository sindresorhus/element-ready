'use strict';
const ManyKeysMap = require('many-keys-map');
const pDefer = require('p-defer');

const cache = new ManyKeysMap();
const isDomReady = target =>
	['interactive', 'complete'].includes((target.ownerDocument || target).readyState);

const elementReady = (selector, {
	target = document,
	stopOnDomReady = true,
	expectEntireElement = true,
	timeout = Infinity
} = {}) => {
	const cacheKeys = [selector, stopOnDomReady, timeout, expectEntireElement, target];
	const cachedPromise = cache.get(cacheKeys);
	if (cachedPromise) {
		return cachedPromise;
	}

	let rafId;
	const deferred = pDefer();
	const {promise} = deferred;

	cache.set(cacheKeys, promise);

	const stop = element => {
		cancelAnimationFrame(rafId);
		cache.delete(cacheKeys, promise);
		deferred.resolve(element);
	};

	if (timeout !== Infinity) {
		setTimeout(stop, timeout);
	}

	// Interval to keep checking for it to come into the DOM
	(function check() {
		const element = target.querySelector(selector);

		// When it's ready, only stop if requested or found
		if (isDomReady(target) && (stopOnDomReady || element)) {
			stop(element || undefined); // No `null`
			return;
		}

		let current = element;
		while (current) {
			if (!expectEntireElement || current.nextSibling) {
				stop(element);
				return;
			}

			current = current.parentElement;
		}

		rafId = requestAnimationFrame(check);
	})();

	return Object.assign(promise, {stop});
};

module.exports = elementReady;
