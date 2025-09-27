import {setTimeout as delay} from 'node:timers/promises';
import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {promiseStateSync} from 'p-state';
import elementReady, {observeReadyElements} from './index.js';

const {window} = new JSDOM();
globalThis.window = window;
globalThis.document = window.document;
globalThis.Node = window.Node;
globalThis.MutationObserver = window.MutationObserver;

after(() => {
	// Force clear all timers and intervals
	const timerId = setTimeout(() => {}, 0);
	for (let i = 0; i < timerId; i++) {
		clearTimeout(i);
		clearInterval(i);
	}

	// Close JSDOM window
	window.close();
});

let index = 0;

function composeElementId() {
	return `unicorn${index++}`;
}

test('check if element ready', async () => {
	const id = composeElementId();
	const elementCheck = elementReady(`#${id}`, {stopOnDomReady: false, signal: AbortSignal.timeout(5000)});

	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id;
		document.body.append(element);
	})();

	const element = await elementCheck;
	assert.equal(element.id, id);
});

test('check elements against a predicate', async () => {
	const id = composeElementId();

	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: false,
		predicate: element => element.textContent && element.textContent.match(/wanted/i),
		signal: AbortSignal.timeout(5000),
	});

	(async () => {
		await delay(500);
		const listElement = document.createElement('ul');
		for (const text of ['some text', 'wanted text']) {
			const li = document.createElement('li');
			li.id = id;
			li.textContent = text;
			listElement.append(li);
		}

		document.body.append(listElement);
	})();

	const element = await elementCheck;
	assert.equal(element.textContent, 'wanted text');
});

test('check if element ready inside target', async () => {
	const target = document.createElement('p');
	const id = composeElementId();
	const elementCheck = elementReady(`#${id}`, {
		target,
		stopOnDomReady: false,
		signal: AbortSignal.timeout(5000),
	});

	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id;
		target.append(element);
	})();

	const element = await elementCheck;
	assert.equal(element.id, id);
});

test('check if different elements ready inside different targets with same selector', async () => {
	const class_ = composeElementId();

	const target1 = document.createElement('p');
	const id1 = composeElementId();
	const elementCheck1 = elementReady(`.${class_}`, {
		target: target1,
		stopOnDomReady: false,
		signal: AbortSignal.timeout(5000),
	});
	const target2 = document.createElement('span');
	const id2 = composeElementId();
	const elementCheck2 = elementReady(`.${class_}`, {
		target: target2,
		stopOnDomReady: false,
		signal: AbortSignal.timeout(5000),
	});

	(async () => {
		await delay(500);
		const element1 = document.createElement('p');
		element1.id = id1;
		element1.className = class_;
		target1.append(element1);

		const element2 = document.createElement('span');
		element2.id = id2;
		element2.className = class_;
		target2.append(element2);
	})();

	const element1 = await elementCheck1;
	assert.equal(element1.id, id1);

	const element2 = await elementCheck2;
	assert.equal(element2.id, id2);
});

test('check if element ready after dom loaded', async () => {
	const id = composeElementId();
	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: true,
	});

	// The element will be added eventually, but we're not around to wait for it
	const timeoutId = setTimeout(() => {
		const element = document.createElement('p');
		element.id = id;
		document.body.append(element);
	}, 50_000);

	const element = await elementCheck;
	assert.equal(element, undefined);
	clearTimeout(timeoutId);
});

test('check if element ready before dom loaded', async () => {
	const element = document.createElement('p');
	const id = composeElementId();
	element.id = id;
	document.body.append(element);

	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: true,
	});

	assert.equal(await elementCheck, element);
});

test('stop checking if DOM was already ready', async () => {
	const id = composeElementId();
	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: true,
	});

	assert.equal(await elementCheck, undefined);
});

test('check if element ready after timeout', async () => {
	const id = composeElementId();
	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: false,
		signal: AbortSignal.timeout(1000),
	});

	// The element will be added eventually, but we're not around to wait for it
	const timeoutId = setTimeout(() => {
		const element = document.createElement('p');
		element.id = id;
		document.body.append(element);
	}, 50_000);

	const element = await elementCheck;
	assert.equal(element, undefined);
	clearTimeout(timeoutId);
});

test('check if element ready before timeout', async () => {
	const element = document.createElement('p');
	const id = composeElementId();
	element.id = id;
	document.body.append(element);

	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: false,
		signal: AbortSignal.timeout(10),
	});

	assert.equal(await elementCheck, element);
});

test('check if wait can be stopped', async () => {
	const controller = new AbortController();
	const id = composeElementId();

	const elementCheck = elementReady(`#${id}`, {stopOnDomReady: false, signal: controller.signal});

	await delay(200);
	controller.abort();

	await delay(500);
	const element = document.createElement('p');
	element.id = id;
	document.body.append(element);

	assert.equal(await elementCheck, undefined);
});

test('ensure different promises are returned on second call with the same selector when first was stopped', async () => {
	const controller = new AbortController();
	const class_ = composeElementId();

	const elementCheck1 = elementReady(`.${class_}`, {stopOnDomReady: false, signal: controller.signal});

	controller.abort();

	const elementCheck2 = elementReady(`.${class_}`, {stopOnDomReady: false, signal: AbortSignal.timeout(5000)});

	assert.notEqual(elementCheck1, elementCheck2);
	assert.equal(await elementCheck1, undefined);
});

test('ensure different promises are returned on second call with the same selector when first was found', async () => {
	const class_ = composeElementId();

	const prependElement = () => {
		const element = document.createElement('p');
		element.className = class_;
		document.body.prepend(element);
		return element;
	};

	assert.equal(prependElement(), await elementReady(`.${class_}`));

	document.querySelector(`.${class_}`).remove();
	assert.equal(prependElement(), await elementReady(`.${class_}`));

	document.querySelector(`.${class_}`).remove();
	assert.equal(prependElement(), await elementReady(`.${class_}`));
});

test('ensure that the whole element has loaded', async () => {
	const id = composeElementId();

	const jsdom = new JSDOM(`<nav id="${id}">`);
	const {window} = jsdom;
	const {document} = window;

	// Fake the pre-DOM-ready state
	Object.defineProperty(document, 'readyState', {
		get: () => 'loading',
	});

	const navigationElement = document.querySelector(`#${id}`);
	const partialCheck = elementReady(`#${id}`, {
		target: document,
		waitForChildren: false,
	});

	const entireCheck = elementReady(`#${id}`, {
		target: document,
		waitForChildren: true,
	});

	assert.equal(await partialCheck, navigationElement, '<nav> appears in the loading document, so it should be found whether it\'s loaded fully or not');
	const expectation = 'elementReady can\'t guarantee the element has loaded in full';
	assert.equal(promiseStateSync(entireCheck), 'pending', expectation);

	navigationElement.innerHTML = '<ul><li>Home</li><li>About</li></ul>';
	assert.equal(promiseStateSync(entireCheck), 'pending', expectation);

	navigationElement.insertAdjacentHTML('beforebegin', '<h1>Site title</h1>');
	assert.equal(promiseStateSync(entireCheck), 'pending', expectation);

	navigationElement.after('Some other part of the page, even a text node');
	assert.equal(await entireCheck, await partialCheck, 'Something appears after <nav>, so it\'s guaranteed that it loaded in full');
	window.close();
});

test('check if elements from multiple selectors are ready', async () => {
	const id1 = composeElementId();
	const id2 = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id1;
		document.body.append(element);
	})();

	const unicorn = await elementReady([`#${id1}`, `#${id2}`], {stopOnDomReady: false, signal: AbortSignal.timeout(5000)});
	assert.equal(unicorn.id, id1, 'should catch the unicorn');
});

test('subscribe to newly added elements that match a selector', async () => {
	const id1 = composeElementId();
	const id3 = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id1;
		document.body.append(element);

		const element2 = document.createElement('p');
		element2.id = id1;
		document.body.append(element2);

		await delay(500);

		const element3 = document.createElement('p');
		element3.id = id3;
		document.body.append(element3);
	})();

	const readyElements = observeReadyElements(`#${id1}, #${id3}`, {stopOnDomReady: false, signal: AbortSignal.timeout(5000)});
	let readyElementsCount = 0;

	for await (const element of readyElements) {
		readyElementsCount++;
		assert.equal(element.id, id1);

		if (readyElementsCount === 2) {
			break;
		}
	}

	for await (const element of readyElements) {
		readyElementsCount++;
		assert.equal(element.id, id3);

		if (readyElementsCount === 3) {
			break;
		}
	}
});

test('subscribe to newly added elements that match a predicate', async () => {
	const class_ = composeElementId();

	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.className = class_;
		element.textContent = 'unicorn';
		document.body.append(element);

		const element2 = document.createElement('p');
		element2.className = class_;
		element2.textContent = 'horse';
		document.body.append(element2);

		await delay(500);

		const element3 = document.createElement('p');
		element3.className = class_;
		element3.textContent = 'penguin';
		document.body.append(element3);
	})();

	const readyElements = observeReadyElements(`.${class_}`, {
		stopOnDomReady: false,
		predicate: element => element.textContent && element.textContent.match(/penguin|unicorn/),
		signal: AbortSignal.timeout(5000),
	});
	let readyElementsCount = 0;

	for await (const element of readyElements) {
		readyElementsCount++;
		assert.match(element.textContent, /unicorn|penguin/);

		if (readyElementsCount === 2) {
			break;
		}
	}
});

test('timeout when subscribed elements are never added', async () => {
	const id = composeElementId();

	const readyElements = observeReadyElements(`#${id}`, {stopOnDomReady: false, signal: AbortSignal.timeout(2000)});

	let readyElementsCount = 0;

	for await (const _ of readyElements) {
		readyElementsCount++;
	}

	assert.equal(readyElementsCount, 0, 'Should not have found any elements');
});

test('subscribe to newly added elements that match one of multiple selectors', async () => {
	const id1 = composeElementId();
	const id2 = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id1;
		document.body.append(element);
		await delay(500);
		const element2 = document.createElement('div');
		element2.id = id2;
		document.body.append(element2);
	})();

	const readyElements = observeReadyElements([`#${id1}`, `#${id2}`], {stopOnDomReady: false, signal: AbortSignal.timeout(5000)});

	const readyElementIds = [];

	for await (const element of readyElements) {
		readyElementIds.push(element.id);

		if (readyElementIds.length === 2) {
			break;
		}
	}

	assert.deepEqual(readyElementIds, [id1, id2], 'should catch elements matching either selector');
});

test('ensure nothing is returned if subscribing to newly added elements but dom is ready', async () => {
	const id = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id;
		document.body.append(element);
	})();

	const readyElements = observeReadyElements(`#${id}`, {stopOnDomReady: true});

	let readyElementsCount = 0;

	for await (const _ of readyElements) {
		readyElementsCount++;
	}

	assert.equal(readyElementsCount, 0, 'Should not have found any elements');
});

test('subscribe to elements that eventually match a selector', async () => {
	const id = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		document.body.append(element);
		await delay(1000);
		element.id = id;
	})();

	const readyElements = observeReadyElements(`#${id}`, {stopOnDomReady: false, signal: AbortSignal.timeout(2000)});

	let readyElementsCount = 0;

	// eslint-disable-next-line no-unreachable-loop
	for await (const element of readyElements) {
		assert.equal(element.id, id);
		readyElementsCount++;
		break; // Exit after finding the first element
	}

	assert.equal(readyElementsCount, 1, 'Should have found exactly one element');
});

test('subscribe to element that eventually matches a complex selector: has', {skip: 'Known to fail'}, async () => {
	const parentId = composeElementId();
	const childId = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('div');
		element.id = parentId;
		document.body.append(element);
		await delay(500);
		const child = document.createElement('p');
		child.id = childId;
		element.append(child);
	})();

	const readyElements = observeReadyElements(`#${parentId}:has(#${childId})`, {stopOnDomReady: false, signal: AbortSignal.timeout(2000)});

	let readyElementsCount = 0;

	// eslint-disable-next-line no-unreachable-loop
	for await (const element of readyElements) {
		assert.equal(element.id, childId);
		readyElementsCount++;
		break; // Exit after finding the first element
	}

	assert.equal(readyElementsCount, 1, 'Should have found exactly one element');
});

test('subscribe to element that eventually matches a complex selector: not has, valid-invalid-valid', {skip: 'Known to fail'}, async () => {
	const parentId = composeElementId();
	const childId = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('div');
		element.id = parentId;
		document.body.append(element);
		await delay(500);
		const child = document.createElement('p');
		child.id = childId;
		child.textContent = 'horse';
		element.append(child);
		await delay(500);
		child.remove();
	})();

	const readyElements = observeReadyElements(`#${parentId}:not(:has(#${childId}))`, {stopOnDomReady: false, signal: AbortSignal.timeout(2000)});

	let readyElementsCount = 0;

	for await (const element of readyElements) {
		assert.equal(element.textContent, 'horse');
		readyElementsCount++;
		if (readyElementsCount === 2) {
			break; // Exit after finding both elements
		}
	}

	assert.equal(readyElementsCount, 2, 'Should have matched the element twice');
});

test('subscribe to element that eventually matches a complex selcetor: not has, invalid-valid', {skip: 'Known to fail'}, async () => {
	const parentId = composeElementId();
	const childId = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('div');
		element.id = parentId;
		const child = document.createElement('p');
		child.id = childId;
		child.textContent = 'horse';
		element.append(child);
		document.body.append(element);
		await delay(500);
		child.remove();
	})();

	const readyElements = observeReadyElements(`#${parentId}:not(:has(#${childId}))`, {stopOnDomReady: false, signal: AbortSignal.timeout(2000)});

	let readyElementsCount = 0;

	// eslint-disable-next-line no-unreachable-loop
	for await (const element of readyElements) {
		assert.equal(element.textContent, 'horse');
		readyElementsCount++;
		break; // Exit after finding the first element
	}

	assert.equal(readyElementsCount, 1, 'Should have match the element once');
});

test('subscribe to element that eventually matches a complex selcetor: +', async () => {
	const firstId = composeElementId();
	const secondId = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('div');
		element.id = firstId;
		document.body.append(element);
		await delay(500);
		const sibling = document.createElement('p');
		sibling.id = secondId;
		element.after(sibling);
	})();

	const readyElements = observeReadyElements(`#${firstId} + #${secondId}`, {stopOnDomReady: false, signal: AbortSignal.timeout(2000)});

	let readyElementsCount = 0;

	// eslint-disable-next-line no-unreachable-loop
	for await (const element of readyElements) {
		assert.equal(element.id, secondId);
		readyElementsCount++;
		break; // Exit after finding the first element
	}

	assert.equal(readyElementsCount, 1, 'Should have found exactly one element');
});

test('subscribe to element that eventually matches a complex selcetor: +, first added second', {skip: 'Known to fail'}, async () => {
	const firstId = composeElementId();
	const secondId = composeElementId();
	(async () => {
		await delay(500);
		const sibling = document.createElement('p');
		sibling.id = secondId;
		document.body.append(sibling);
		await delay(500);
		const element = document.createElement('div');
		element.id = firstId;
		sibling.before(element);
	})();

	const readyElements = observeReadyElements(`#${firstId} + #${secondId}`, {stopOnDomReady: false, signal: AbortSignal.timeout(2000)});

	let readyElementsCount = 0;

	// eslint-disable-next-line no-unreachable-loop
	for await (const element of readyElements) {
		assert.equal(element.id, secondId);
		readyElementsCount++;
		break; // Exit after finding the first element
	}

	assert.equal(readyElementsCount, 1, 'Should have found exactly one element');
});

test('subscribe to elements that eventually match a complex selector: ~', async () => {
	const firstId = composeElementId();
	const secondId = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('div');
		element.id = firstId;
		document.body.append(element);
		await delay(500);
		const sibling = document.createElement('p');
		sibling.id = secondId;
		element.after(sibling);
	})();

	const readyElements = observeReadyElements(`#${firstId} ~ #${secondId}`, {stopOnDomReady: false, signal: AbortSignal.timeout(2000)});

	let readyElementsCount = 0;

	// eslint-disable-next-line no-unreachable-loop
	for await (const element of readyElements) {
		assert.equal(element.id, secondId);
		readyElementsCount++;
		break; // Exit after finding the first element
	}

	assert.equal(readyElementsCount, 1, 'Should have found exactly one element');
});

test('subscribe to elements that eventually match a predicate', {skip: 'Known to fail'}, async () => {
	const id = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id;
		element.textContent = 'unicorn';
		document.body.append(element);

		await delay(1000);
		element.textContent = 'penguin';
	})();

	const readyElements = observeReadyElements(id, {
		stopOnDomReady: false,
		predicate: element => element.textContent && element.textContent.match(/penguin/),
		signal: AbortSignal.timeout(2000),
	});

	let readyElementsCount = 0;

	// eslint-disable-next-line no-unreachable-loop
	for await (const element of readyElements) {
		assert.equal(element.textContent, 'penguin');
		readyElementsCount++;
		break; // Exit after finding the first element
	}

	assert.equal(readyElementsCount, 1, 'Should have found exactly one element');
});

test('subscribe to elements with eventually matching character data', {skip: 'Known to fail'}, async () => {
	const id = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id;
		element.textContent = 'unicorn';
		document.body.append(element);

		await delay(1000);
		element.textContent = 'penguin';
	})();

	const readyElements = observeReadyElements(`#${id}`, {
		stopOnDomReady: false,
		predicate: element => element.textContent && element.textContent.match(/penguin/),
		signal: AbortSignal.timeout(2000),
	});

	let readyElementsCount = 0;

	// eslint-disable-next-line no-unreachable-loop
	for await (const element of readyElements) {
		assert.equal(element.textContent, 'penguin');
		readyElementsCount++;
		break; // Exit after finding the first element
	}

	assert.equal(readyElementsCount, 1, 'Should have found exactly one element');
});
