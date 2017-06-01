'use strict';

const selectorCache = new Map();

module.exports = selector => {
	if (selectorCache.has(selector)) {
		return selectorCache.get(selector);
	}

	const promise = new Promise(resolve => {
		// Interval to keep checking for it to come into the DOM
		(function check() {
			const el = document.querySelector(selector);

			if (el) {
				resolve(el);
				selectorCache.delete(selector);
			} else {
				requestAnimationFrame(check);
			}
		})();
	});

	selectorCache.set(selector, promise);

	return promise;
};
