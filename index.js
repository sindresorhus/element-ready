'use strict';
module.exports = selector => {
	return new Promise(resolve => {
		const el = document.querySelector(selector);

		// shortcut if the element already exists
		if (el) {
			resolve(el);
			return;
		}

		// interval to keep checking for it to come into the DOM
		const awaitElement = setInterval(() => {
			const el = document.querySelector(selector);

			if (el) {
				resolve(el);
				clearInterval(awaitElement);
			}
		}, 50);
	});
};
