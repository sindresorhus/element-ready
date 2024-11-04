import requestAnimationFrames from 'request-animation-frames';
import domMutations from 'dom-mutations';

const isDomReady = target =>
	['interactive', 'complete'].includes((target.ownerDocument ?? target).readyState);

export default function elementReady(selector, {
	target = document,
	stopOnDomReady = true,
	waitForChildren = true,
	timeout = Number.POSITIVE_INFINITY,
	predicate,
} = {}) {
	// Not necessary, it just acts faster and avoids listener setup
	if (stopOnDomReady && isDomReady(target)) {
		const promise = Promise.resolve(getMatchingElement({target, selector, predicate}));
		promise.stop = () => {};
		return promise;
	}

	let shouldStop = false;

	const stop = () => {
		shouldStop = true;
	};

	if (timeout !== Number.POSITIVE_INFINITY) {
		setTimeout(stop, timeout);
	}

	// Interval to keep checking for it to come into the DOM
	const promise = (async () => {
		for await (const _ of requestAnimationFrames()) {
			if (shouldStop) {
				return;
			}

			const element = getMatchingElement({target, selector, predicate});

			// When it's ready, only stop if requested or found
			if (isDomReady(target) && (stopOnDomReady || element)) {
				return element;
			}

			let current = element;
			while (current) {
				if (!waitForChildren || current.nextSibling) {
					return element;
				}

				current = current.parentElement;
			}
		}
	})();

	promise.stop = stop;

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
		return target.querySelector(selector) ?? undefined; // No `null`
	}

	for (const element of target.querySelectorAll(selector)) {
		if (predicate(element)) {
			return element;
		}
	}
}
