'use strict';
const PCancelable = require('p-cancelable');

const targetCache = new WeakMap();

const cleanCache = (target, selector) => {
	const map = targetCache.get(target);
	if (map) {
		map.delete(selector);
		if (map.size === 0) {
			targetCache.delete(target);
		}
	}
};

module.exports = (selector, options) => {
	options = Object.assign({
		target: document
	}, options);

	if (targetCache.has(options.target) && targetCache.get(options.target).has(selector)) {
		return targetCache.get(options.target).get(selector);
	}

	let alreadyFound = false;
	const promise = new PCancelable((resolve, reject, onCancel) => {
		let raf;
		onCancel(() => {
			cancelAnimationFrame(raf);
			cleanCache(options.target, selector);
		});

		// Interval to keep checking for it to come into the DOM
		(function check() {
			const el = options.target.querySelector(selector);

			if (el) {
				resolve(el);
				alreadyFound = true;
				cleanCache(options.target, selector);
			} else {
				raf = requestAnimationFrame(check);
			}
		})();
	});

	// The element might have been found in the first synchronous check
	if (!alreadyFound) {
		if (targetCache.has(options.target)) {
			targetCache.get(options.target).set(selector, promise);
		} else {
			targetCache.set(options.target, new Map([[selector, promise]]));
		}
	}

	return promise;
};
