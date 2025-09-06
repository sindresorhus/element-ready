import requestAnimationFrames from 'request-animation-frames';
import domMutations from 'dom-mutations';

const isDomReady = target =>
	['interactive', 'complete'].includes((target.ownerDocument ?? target).readyState);

export default async function elementReady(selector, {
	target = document,
	stopOnDomReady = true,
	waitForChildren = true,
	signal,
	predicate,
} = {}) {
	if (signal?.aborted) {
		return;
	}

	// Not necessary, it just acts faster and avoids listener setup
	if (stopOnDomReady && isDomReady(target)) {
		return getMatchingElement({target, selector, predicate});
	}

	// Interval to keep checking for it to come into the DOM
	for await (const _ of requestAnimationFrames()) {
		if (signal?.aborted) {
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
}

async function * consumeAsyncIteratorWithAbortSignal(iterator, signal) {
	const aborted = Symbol('aborted');

	const abortPromise = new Promise(resolve => {
		if (signal) {
			signal.addEventListener('abort', () => {
				iterator.return(); // Stop iterator from producing values after the next one
				resolve(aborted);
			});
		}
	});

	while (true) {
		const next = await Promise.race([iterator.next(), abortPromise]); // eslint-disable-line no-await-in-loop

		if (next === aborted || next.done) {
			return;
		}

		yield next.value;
	}
}

export function observeReadyElements(selector, {
	target = document,
	stopOnDomReady = true,
	waitForChildren = true,
	signal,
	predicate,
} = {}) {
	return {
		async * [Symbol.asyncIterator]() {
			if (signal?.aborted || (stopOnDomReady && isDomReady(target))) {
				return;
			}

			const iterator = domMutations(target, {childList: true, subtree: true})[Symbol.asyncIterator]();

			if (stopOnDomReady) {
				const controller = new AbortController();

				target.addEventListener('DOMContentLoaded', () => {
					controller.abort();
				}, {once: true});

				signal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
			}

			for await (const {addedNodes} of consumeAsyncIteratorWithAbortSignal(iterator, signal)) {
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
