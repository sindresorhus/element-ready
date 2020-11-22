'use strict';
const ManyKeysMap = require('many-keys-map');

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
	const cacheKeys = [expectEntireElement, target, selector, stopOnDomReady, timeout];
	const cachedPromise = cache.get(cacheKeys);
	if (cachedPromise) {
		return cachedPromise;
	}

	let rafId;
	let stop;
	const promise = new Promise(resolve => {
		stop = () => {
			cancelAnimationFrame(rafId);
			resolve();
		};

		if (timeout !== Infinity) {
			setTimeout(stop, timeout);
		}

		// Interval to keep checking for it to come into the DOM.
		(function check() {
			const element = target.querySelector(selector);

			if (element) {
				// If the document has finished loading, the elements are always "fully loaded"
				console.log(selector, expectEntireElement, isDomReady(target));
				if (!expectEntireElement || isDomReady(target)) {
					resolve(element);
					return;
				}

				let current = element;
				do {
					if (current.nextSibling) {
						resolve(element);
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
	});

	cache.set(cacheKeys, promise);
	(async () => {
		await promise;
		cache.delete(cacheKeys, promise);
	})();

	return Object.assign(promise, {stop});
};

module.exports = elementReady;
