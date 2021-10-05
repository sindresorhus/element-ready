import ManyKeysMap from 'many-keys-map';
import pDefer from 'p-defer';
import createDeferredAsyncIterator from 'deferred-async-iterator';

const cache = new ManyKeysMap();

const isDomReady = target =>
	['interactive', 'complete'].includes((target.ownerDocument || target).readyState);

export default function elementReady(selector, {
	target = document,
	stopOnDomReady = true,
	waitForChildren = true,
	timeout = Number.POSITIVE_INFINITY,
	predicate,
} = {}) {
	const cacheKeys = [selector, stopOnDomReady, timeout, waitForChildren, target];
	const cachedPromise = cache.get(cacheKeys);
	if (cachedPromise) {
		return cachedPromise;
	}

	let rafId;
	const deferred = pDefer();
	const {promise} = deferred;

	cache.set(cacheKeys, promise);

	const stop = element => {
		cancelAnimationFrame(rafId);
		cache.delete(cacheKeys, promise);
		deferred.resolve(element);
	};

	if (timeout !== Number.POSITIVE_INFINITY) {
		setTimeout(stop, timeout);
	}

	// Interval to keep checking for it to come into the DOM
	(function check() {
		const element = getMatchingElement({target, selector, predicate});

		// When it's ready, only stop if requested or found
		if (isDomReady(target) && (stopOnDomReady || element)) {
			stop(element || undefined); // No `null`
			return;
		}

		let current = element;
		while (current) {
			if (!waitForChildren || current.nextSibling) {
				stop(element);
				return;
			}

			current = current.parentElement;
		}

		rafId = requestAnimationFrame(check);
	})();

	return Object.assign(promise, {stop: () => stop()});
}

export function observeReadyElements(selector, {
	target = document,
	stopOnDomReady = true,
	waitForChildren = true,
	timeout = Number.POSITIVE_INFINITY,
	predicate,
} = {}) {
	return {
		[Symbol.asyncIterator]() {
			const {next, complete, onCleanup, iterator} = createDeferredAsyncIterator();

			function handleMutations(mutations) {
				for (const {addedNodes} of mutations) {
					for (const element of addedNodes) {
						if (element.nodeType !== 1 || !element.matches(selector) || (predicate && !predicate(element))) {
							continue;
						}

						// When it's ready, only stop if requested or found
						if (isDomReady(target) && element) {
							next(element);
							continue;
						}

						let current = element;
						while (current) {
							if (!waitForChildren || current.nextSibling) {
								next(element);
								continue;
							}

							current = current.parentElement;
						}
					}
				}
			}

			const observer = new MutationObserver(handleMutations);

			observer.observe(target, {
				childList: true,
				subtree: true,
			});

			function stop() {
				handleMutations(observer.takeRecords());
				complete();
			}

			onCleanup(() => {
				observer.disconnect();
			});

			if (stopOnDomReady) {
				target.addEventListener('DOMContentLoaded', stop, {once: true});
			}

			if (timeout !== Number.POSITIVE_INFINITY) {
				setTimeout(stop, timeout);
			}

			return iterator;
		},
	};
}

function getMatchingElement({target, selector, predicate} = {}) {
	if (predicate) {
		const elements = target.querySelectorAll(selector);
		return [...elements].find(element => predicate(element));
	}

	return target.querySelector(selector);
}
