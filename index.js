'use strict';

const selectorMap = {};

module.exports = selector => {
	if (selectorMap[selector]) {
		return selectorMap[selector];
	}

	selectorMap[selector] = new Promise(resolve => {
		const el = document.querySelector(selector);

		// shortcut if the element already exists
		if (el) {
			resolve(el);
			delete selectorMap[selector];
			return;
		}

		// interval to keep checking for it to come into the DOM
		const awaitElement = setInterval(() => {
			const el = document.querySelector(selector);

			if (el) {
				resolve(el);
				clearInterval(awaitElement);
				delete selectorMap[selector];
			}
		}, 50);
	});

	return selectorMap[selector];
};
