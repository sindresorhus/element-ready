'use strict';

const selectorMap = new Map();

module.exports = selector => {
	if (selectorMap.has(selector)) {
		return selectorMap.get(selector);
	}

	const promise = new Promise(resolve => {
		const el = document.querySelector(selector);

		// shortcut if the element already exists
		if (el) {
			resolve(el);
			selectorMap.delete(selector);
			return;
		}

		// interval to keep checking for it to come into the DOM
		const awaitElement = setInterval(() => {
			const el = document.querySelector(selector);

			if (el) {
				resolve(el);
				clearInterval(awaitElement);
				selectorMap.delete(selector);
			}
		}, 50);
	});

	return selectorMap.set(selector, promise).get(selector);
};
