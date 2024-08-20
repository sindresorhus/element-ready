import ManyKeysMap from 'many-keys-map';
import requestAnimationFrames from 'request-animation-frames';
import domMutations from 'dom-mutations';

const cache = new ManyKeysMap();

const isDomReady = target =>
	['interactive', 'complete'].includes((target.ownerDocument ?? target).readyState);

export default function elementReady(selector, {
	target = document,
	stopOnDomReady = true,
	waitForChildren = true,
	timeout = Number.POSITIVE_INFINITY,
	predicate,
} = {}) {
	const cacheKey = [selector, stopOnDomReady, timeout, waitForChildren, target];
	const cachedPromise = cache.get(cacheKey);
	if (cachedPromise) {
		return cachedPromise;
	}

	let shouldStop = false;

	const stop = () => {
		cache.delete(cacheKey, promise);
		shouldStop = true;
	};

	if (timeout !== Number.POSITIVE_INFINITY) {
		setTimeout(stop, timeout);
	}

	// Interval to keep checking for it to come into the DOM
	const promise = (async () => {
		try {
			for await (const _ of requestAnimationFrames()) { // eslint-disable-line no-unused-vars
				if (shouldStop) {
					return;
				}

				const element = getMatchingElement({target, selector, predicate});

				// When it's ready, only stop if requested or found
				if (isDomReady(target) && (stopOnDomReady || element)) {
					return element ?? undefined; // No `null`
				}

				let current = element;
				while (current) {
					if (!waitForChildren || current.nextSibling) {
						return element;
					}

					current = current.parentElement;
				}
			}
		} finally {
			cache.delete(cacheKey, promise);
		}
	})();

	promise.stop = stop;

	cache.set(cacheKey, promise);

	return promise;
}

export function observeReadyElements(selector, {
	target = document,
	stopOnDomReady = true,
	waitForChildren = true,
	timeout = Number.POSITIVE_INFINITY,
	predicate,
} = {}) {
	return {
		async * [Symbol.asyncIterator]() {
			const iterator = domMutations(target, {childList: true, subtree: true})[Symbol.asyncIterator]();

			if (stopOnDomReady) {
				if (isDomReady(target)) {
					return;
				}

				target.addEventListener('DOMContentLoaded', () => {
					iterator.return();
				}, {once: true});
			}

			if (timeout !== Number.POSITIVE_INFINITY) {
				setTimeout(() => {
					iterator.return();
				}, timeout);
			}

			for await (const {addedNodes} of iterator) {
				for (const element of addedNodes) {
					if (element.nodeType !== 1 || !element.matches(selector) || (predicate && !predicate(element))) {
						continue;
					}

					// When it's ready, only stop if requested or found
					if (isDomReady(target) && element) {
						yield element;
						continue;
					}

					let current = element;
					while (current) {
						if (!waitForChildren || current.nextSibling) {
							yield element;
							break;
						}

						current = current.parentElement;
					}
				}
			}
		},
	};
}

function getMatchingElement({target, selector, predicate}) {
	if (!predicate) {
		return target.querySelector(selector);
	}

	for (const element of target.querySelectorAll(selector) {
		if (predicate(element)) {
			return element;
		}
	}
}
