'use strict';
const PCancelable = require('p-cancelable');

const selectorCache = new Map();

module.exports = selector => {
	if (selectorCache.has(selector)) {
		return selectorCache.get(selector);
	}

	const promise = new PCancelable((onCancel, resolve) => {
		let raf;
		onCancel(() => {
			cancelAnimationFrame(raf);
		});

		// Interval to keep checking for it to come into the DOM
		(function check() {
			const el = document.querySelector(selector);

			if (el) {
				resolve(el);
				selectorCache.delete(selector);
			} else {
				raf = requestAnimationFrame(check);
			}
		})();
	});

	selectorCache.set(selector, promise);

	return promise;
};
