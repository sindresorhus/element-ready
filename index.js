'use strict';
const ManyKeysMap = require('many-keys-map');
const pDefer = require('p-defer');

const cache = new ManyKeysMap();
const isDomReady = target =>
	(target.ownerDocument || target).readyState === 'interactive' ||
	(target.ownerDocument || target).readyState === 'complete';

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
			// If the document has finished loading, the elements are always "fully loaded"
			if (!expectEntireElement || isDomReady(target)) {
				deferred.resolve(element);
				stop();
				return;
			}

			let current = element;
			do {
				if (current.nextSibling) {
					deferred.resolve(element);
					stop();
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
