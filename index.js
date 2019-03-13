'use strict';
const PCancelable = require('p-cancelable');
const ManyKeysMap = require('many-keys-map');

const cache = new ManyKeysMap();

module.exports = (selector, options) => {
	const {target} = Object.assign({
		target: document
	}, options);

	let promise = cache.get([target, selector]);
	if (promise) {
		return promise;
	}

	let alreadyFound = false;
	promise = new PCancelable((resolve, reject, onCancel) => {
		let raf;
		onCancel(() => {
			cancelAnimationFrame(raf);
			cache.delete([target, selector], promise);
		});

		// Interval to keep checking for it to come into the DOM
		(function check() {
			const el = target.querySelector(selector);

			if (el) {
				resolve(el);
				alreadyFound = true;
				cache.delete([target, selector], promise);
			} else {
				raf = requestAnimationFrame(check);
			}
		})();
	});

	if (!alreadyFound) {
		cache.set([target, selector], promise);
	}

	return promise;
};
