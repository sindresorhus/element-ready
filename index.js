import requestAnimationFrames from 'request-animation-frames';
import domMutations from 'dom-mutations';

const getOwnerDocument = target => {
	if (target?.nodeType === Node.DOCUMENT_NODE) {
		return target;
	}

	return target?.ownerDocument ?? target?.host?.ownerDocument;
};

const isDomReady = target => {
	const ownerDocument = getOwnerDocument(target);
	return ownerDocument ? ['interactive', 'complete'].includes(ownerDocument.readyState) : false;
};

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

	// Interval to keep checking for it to come into the DOM.
	const childrenStates = waitForChildren ? new WeakMap() : undefined;

	for await (const _ of requestAnimationFrames()) {
		if (signal?.aborted) {
			return;
		}

		const element = getMatchingElement({target, selector, predicate});

		// When it's ready, only stop if requested or found
		if (isDomReady(target) && (stopOnDomReady || element)) {
			return element;
		}

		if (element === undefined) {
			continue;
		}

		// When `waitForChildren` is enabled, resolve only once the element is guaranteed to be fully parsed.
		if (!waitForChildren) {
			return element;
		}

		const childrenState = getChildrenState(childrenStates, element, target);

		if (isChildrenReady({element, target, childrenState})) {
			return element;
		}
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

			// Track per-element parsing state across mutations.
			const childrenStates = waitForChildren ? new WeakMap() : undefined;

			const iterator = domMutations(target, {
				childList: true,
				subtree: true,
				attributes: true,
			})[Symbol.asyncIterator]();

			if (stopOnDomReady) {
				target.addEventListener('DOMContentLoaded', () => {
					iterator.return();
				}, {once: true});
			}

			if (signal) {
				signal.addEventListener('abort', () => {
					iterator.return();
				}, {once: true});
			}

			for await (const mutation of iterator) {
				const addedNodes = mutation.type === 'childList' ? mutation.addedNodes : [mutation.target];

				for (const element of addedNodes) {
					if (element.nodeType !== Node.ELEMENT_NODE || !element.matches(selector) || (predicate && !predicate(element))) {
						continue;
					}

					// When it's ready, only stop if requested or found
					if (isDomReady(target) && element) {
						yield element;
						continue;
					}

					// Match the same "fully parsed" behavior as `elementReady()`.
					if (!waitForChildren) {
						yield element;
						continue;
					}

					const childrenState = getChildrenState(childrenStates, element, target);

					if (isChildrenReady({element, target, childrenState})) {
						yield element;
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

function getChildrenState(childrenStates, element, target) {
	// Cache the initial ancestor-sibling snapshot and track child changes per element.
	const {parentNode} = element;
	let childrenState = childrenStates.get(element);

	if (!childrenState || childrenState.parentNode !== parentNode) {
		// Reset snapshot when the element is reparented.
		childrenState = {
			parentNode,
			ancestorSiblingSnapshot: getAncestorSiblingSnapshot({element, target}),
			childNodeCount: element.childNodes.length,
			textLength: element.textContent?.length ?? 0,
			hasChildrenMutated: false,
		};
		childrenStates.set(element, childrenState);
		return childrenState;
	}

	// Track child changes to allow later ancestor siblings to be considered valid.
	if (!childrenState.hasChildrenMutated) {
		const childNodeCount = element.childNodes.length;
		const textLength = element.textContent?.length ?? 0;
		if (childrenState.childNodeCount !== childNodeCount || childrenState.textLength !== textLength) {
			childrenState.hasChildrenMutated = true;
		}

		childrenState.childNodeCount = childNodeCount;
		childrenState.textLength = textLength;
	}

	return childrenState;
}

function isChildrenReady({element, target, childrenState}) {
	const ownerDocument = getOwnerDocument(target) ?? element.ownerDocument;
	if (isDomReady(ownerDocument ?? element)) {
		return true;
	}

	const ancestorSiblingSnapshot = childrenState?.ancestorSiblingSnapshot;
	const hasChildrenMutated = childrenState?.hasChildrenMutated;

	// Consider the element "fully parsed" once it, or any ancestor within `target`, has a next sibling.
	// Ignore `document.head` as it has a `nextSibling` (`body`) from the start, which is not a parsing signal.
	let current = element;
	while (current) {
		if (current === target || current === ownerDocument?.head) {
			return false;
		}

		// Only accept ancestor siblings that existed when the element first matched,
		// unless the element's children changed or it was reparented.
		if (current.nextSibling && (current === element || !ancestorSiblingSnapshot || ancestorSiblingSnapshot.get(current) === current.nextSibling || hasChildrenMutated)) {
			return true;
		}

		current = current.parentNode;
	}

	return false;
}

function getAncestorSiblingSnapshot({element, target}) {
	const ownerDocument = getOwnerDocument(target) ?? element.ownerDocument;
	const ancestorSiblingSnapshot = new Map();

	let current = element.parentNode;
	while (current) {
		if (current === target || current === ownerDocument?.head) {
			break;
		}

		if (current.nextSibling) {
			ancestorSiblingSnapshot.set(current, current.nextSibling);
		}

		current = current.parentNode;
	}

	return ancestorSiblingSnapshot;
}
