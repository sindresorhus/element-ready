'use strict';
const PCancelable = require('p-cancelable');
const ManyKeysMap = require('many-keys-map');
const domLoaded = require('dom-loaded');

const cache = new ManyKeysMap();

const elementReady = (selector, options) => {
	const {target, cancelOnDomLoaded} = {
		target: document,
		cancelOnDomLoaded: true,
		...options
	};

	const cacheKeys = [target, selector, cancelOnDomLoaded];
	let promise = cache.get(cacheKeys);
	if (promise) {
		return promise;
	}

	let alreadyFound = false;
	promise = new PCancelable((resolve, reject, onCancel) => {
		let rafId;
		onCancel(() => {
			cancelAnimationFrame(rafId);
			cache.delete(cacheKeys, promise);
		});

		if (cancelOnDomLoaded) {
			domLoaded.then(() => {
				cancelAnimationFrame(rafId);
				resolve();
			});
		}

		// Interval to keep checking for it to come into the DOM
		(function check() {
			const el = target.querySelector(selector);

			if (el) {
				resolve(el);
				alreadyFound = true;
				cache.delete(cacheKeys, promise);
			} else {
				rafId = requestAnimationFrame(check);
			}
		})();
	});

	if (!alreadyFound) {
		cache.set(cacheKeys, promise);
	}

	return promise;
};

module.exports = elementReady;
