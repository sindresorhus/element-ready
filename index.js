'use strict';
const ManyKeysMap = require('many-keys-map');
const domLoaded = require('dom-loaded');
const pDefer = require('p-defer');

const cache = new ManyKeysMap();

const elementReady = (selector, {
	target = document,
	stopOnDomReady = true,
	timeout = Infinity,
	cancellable = true
} = {}) => {
	const cacheKeys = [target, selector, stopOnDomReady, timeout, cancellable];
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

	if (cancellable && stopOnDomReady) {
		(async () => {
			await domLoaded;
			stop();
		})();
	}

	if (timeout !== Infinity) {
		setTimeout(() => {
			if (cancellable) {
				stop();
			} else {
				deferred.reject(new Error(`Element '${selector}' not found`));
			}
		}, timeout);
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

	if (cancellable) {
		Object.assign(promise, {stop});
	}

	return promise;
};

module.exports = elementReady;
