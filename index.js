'use strict';
const PCancelable = require('p-cancelable');

const targetCache = new WeakMap();

const cleanCache = (target, selector) => {
	targetCache.get(target).delete(selector);
	if (!targetCache.get(target).size) {
		targetCache.delete(target);
	}
};

module.exports = (selector, options) => {
	options = Object.assign({
		target: document
	}, options);

	if (targetCache.has(options.target) && targetCache.get(options.target).has(selector)) {
		return targetCache.get(options.target).get(selector);
	}

	const promise = new PCancelable((onCancel, resolve) => {
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
				cleanCache(options.target, selector);
			} else {
				raf = requestAnimationFrame(check);
			}
		})();
	});

	if (targetCache.has(options.target)) {
		targetCache.get(options.target).set(selector, promise);
	} else {
		targetCache.set(options.target, new Map([[selector, promise]]));
	}

	return promise;
};
