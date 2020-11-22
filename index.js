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

	// Interval to keep checking for it to come into the DOM.
	(function check() {
		const element = target.querySelector(selector);

		if (element) {
			// If the document has finished loading, the elements are always "fully loaded"
			if (!expectEntireElement || isDomReady(target)) {
				stop(element);
				return;
			}

			let current = element;
			do {
				if (current.nextSibling) {
					stop(element);
					return;
				}

				current = current.parentElement;
			} while (current);
		} else if (stopOnDomReady && isDomReady(target)) {
			stop();
			return;
		}

		rafId = requestAnimationFrame(check);
	})();

	return Object.assign(promise, {stop});
};

module.exports = elementReady;
