import {setTimeout as delay} from 'node:timers/promises';
import test from 'ava';
import {JSDOM} from 'jsdom';
import {promiseStateSync} from 'p-state';
import elementReady, {observeReadyElements} from './index.js';

const {window} = new JSDOM();
globalThis.window = window;
globalThis.document = window.document;
globalThis.Node = window.Node;
globalThis.MutationObserver = window.MutationObserver;

let index = 0;

function composeElementId() {
	return `unicorn${index++}`;
}

test('check if element ready', async t => {
	const id = composeElementId();
	const elementCheck = elementReady(`#${id}`, {stopOnDomReady: false});

	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id;
		document.body.append(element);
	})();

	const element = await elementCheck;
	t.is(element.id, id);
});

test('check elements against a predicate', async t => {
	const id = composeElementId();

	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: false,
		predicate: element => element.textContent && element.textContent.match(/wanted/i),
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
	t.is(element.textContent, 'wanted text');
});

test('check if element ready inside target', async t => {
	const target = document.createElement('p');
	const id = composeElementId();
	const elementCheck = elementReady(`#${id}`, {
		target,
		stopOnDomReady: false,
	});

	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id;
		target.append(element);
	})();

	const element = await elementCheck;
	t.is(element.id, id);
});

test('check if different elements ready inside different targets with same selector', async t => {
	const class_ = composeElementId();

	const target1 = document.createElement('p');
	const id1 = composeElementId();
	const elementCheck1 = elementReady(`.${class_}`, {
		target: target1,
		stopOnDomReady: false,
	});
	const target2 = document.createElement('span');
	const id2 = composeElementId();
	const elementCheck2 = elementReady(`.${class_}`, {
		target: target2,
		stopOnDomReady: false,
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
	t.is(element1.id, id1);

	const element2 = await elementCheck2;
	t.is(element2.id, id2);
});

test('check if element ready after dom loaded', async t => {
	const id = composeElementId();
	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: true,
	});

	// The element will be added eventually, but we're not around to wait for it
	setTimeout(() => {
		const element = document.createElement('p');
		element.id = id;
		document.body.append(element);
	}, 50_000);

	const element = await elementCheck;
	t.is(element, undefined);
});

test('check if element ready before dom loaded', async t => {
	const element = document.createElement('p');
	const id = composeElementId();
	element.id = id;
	document.body.append(element);

	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: true,
	});

	t.is(await elementCheck, element);
});

test('stop checking if DOM was already ready', async t => {
	const id = composeElementId();
	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: true,
	});

	t.is(await elementCheck, undefined);
});

test('check if element ready after timeout', async t => {
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
	t.is(element, undefined);
	clearTimeout(timeoutId);
});

test('check if element ready before timeout', async t => {
	const element = document.createElement('p');
	const id = composeElementId();
	element.id = id;
	document.body.append(element);

	const elementCheck = elementReady(`#${id}`, {
		stopOnDomReady: false,
		signal: AbortSignal.timeout(10),
	});

	t.is(await elementCheck, element);
});

test('check if wait can be stopped', async t => {
	const controller = new AbortController();
	const id = composeElementId();

	const elementCheck = elementReady(`#${id}`, {stopOnDomReady: false, signal: controller.signal});

	await delay(200);
	controller.abort();

	await delay(500);
	const element = document.createElement('p');
	element.id = id;
	document.body.append(element);

	t.is(await elementCheck, undefined);
});

test('ensure different promises are returned on second call with the same selector when first was stopped', async t => {
	const controller = new AbortController();
	const class_ = composeElementId();

	const elementCheck1 = elementReady(`.${class_}`, {stopOnDomReady: false, signal: controller.signal});

	controller.abort();

	const elementCheck2 = elementReady(`.${class_}`, {stopOnDomReady: false});

	t.not(elementCheck1, elementCheck2);
	t.is(await elementCheck1, undefined);
});

test('ensure different promises are returned on second call with the same selector when first was found', async t => {
	const class_ = composeElementId();

	const prependElement = () => {
		const element = document.createElement('p');
		element.className = class_;
		document.body.prepend(element);
		return element;
	};

	t.is(prependElement(), await elementReady(`.${class_}`));

	document.querySelector(`.${class_}`).remove();
	t.is(prependElement(), await elementReady(`.${class_}`));

	document.querySelector(`.${class_}`).remove();
	t.is(prependElement(), await elementReady(`.${class_}`));
});

test('ensure that the whole element has loaded', async t => {
	const id = composeElementId();

	const {window} = new JSDOM(`<nav id="${id}">`);
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

	t.is(await partialCheck, navigationElement, '<nav> appears in the loading document, so it should be found whether it’s loaded fully or not');
	const expectation = 'elementReady can’t guarantee the element has loaded in full';
	t.is(promiseStateSync(entireCheck), 'pending', expectation);

	navigationElement.innerHTML = '<ul><li>Home</li><li>About</li></ul>';
	t.is(promiseStateSync(entireCheck), 'pending', expectation);

	navigationElement.insertAdjacentHTML('beforebegin', '<h1>Site title</h1>');
	t.is(promiseStateSync(entireCheck), 'pending', expectation);

	navigationElement.after('Some other part of the page, even a text node');
	t.is(await entireCheck, await partialCheck, 'Something appears after <nav>, so it’s guaranteed that it loaded in full');
});

test('check if elements from multiple selectors are ready', async t => {
	const id1 = composeElementId();
	const id2 = composeElementId();
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = id1;
		document.body.append(element);
	})();

	const unicorn = await elementReady([`#${id1}`, `#${id2}`], {stopOnDomReady: false});
	t.is(unicorn.id, id1, 'should catch the unicorn');
});

test('subscribe to newly added elements that match a selector', async t => {
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

	const readyElements = observeReadyElements(`#${id1}, #${id3}`, {stopOnDomReady: false});
	let readyElementsCount = 0;

	for await (const element of readyElements) {
		readyElementsCount++;
		t.is(element.id, id1);

		if (readyElementsCount === 2) {
			break;
		}
	}

	for await (const element of readyElements) {
		readyElementsCount++;
		t.is(element.id, id3);

		if (readyElementsCount === 3) {
			break;
		}
	}
});

test('subscribe to newly added elements that match a predicate', async t => {
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
	});
	let readyElementsCount = 0;

	for await (const element of readyElements) {
		readyElementsCount++;
		t.regex(element.textContent, /unicorn|penguin/);

		if (readyElementsCount === 2) {
			break;
		}
	}
});

test('timeout when subscribed elements are never added', async t => {
	const id = composeElementId();

	const readyElements = observeReadyElements(`#${id}`, {stopOnDomReady: false, signal: AbortSignal.timeout(2000)});

	let readyElementsCount = 0;

	for await (const _ of readyElements) {
		readyElementsCount++;
	}

	t.is(readyElementsCount, 0, 'Should not have found any elements');
});

test('subscribe to newly added elements that match one of multiple selectors', async t => {
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

	const readyElements = observeReadyElements([`#${id1}`, `#${id2}`], {stopOnDomReady: false});

	const readyElementIds = [];

	for await (const element of readyElements) {
		readyElementIds.push(element.id);

		if (readyElementIds.length === 2) {
			break;
		}
	}

	t.deepEqual(readyElementIds, [id1, id2], 'should catch elements matching either selector');
});

test('ensure nothing is returned if subscribing to newly added elements but dom is ready', async t => {
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

	t.is(readyElementsCount, 0, 'Should not have found any elements');
});

test('subscribe to elements that eventually match a selector', async t => {
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

	for await (const element of readyElements) {
		t.is(element.id, id);
		readyElementsCount++;
	}

	t.is(readyElementsCount, 1, 'Should have found exactly one element');
});

test.failing('subscribe to element that eventually matches a complex selector: has', async t => {
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

	for await (const element of readyElements) {
		t.is(element.id, childId);
		readyElementsCount++;
	}

	t.is(readyElementsCount, 1, 'Should have found exactly one element');
});

test.failing('subscribe to element that eventually matches a complex selector: not has, valid-invalid-valid', async t => {
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
		t.is(element.textContent, 'horse');
		readyElementsCount++;
	}

	t.is(readyElementsCount, 2, 'Should have matched the element twice');
});

test.failing('subscribe to element that eventually matches a complex selcetor: not has, invalid-valid', async t => {
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

	for await (const element of readyElements) {
		t.is(element.textContent, 'horse');
		readyElementsCount++;
	}

	t.is(readyElementsCount, 1, 'Should have match the element once');
});

test('subscribe to element that eventually matches a complex selcetor: +', async t => {
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

	for await (const element of readyElements) {
		t.is(element.id, secondId);
		readyElementsCount++;
	}

	t.is(readyElementsCount, 1, 'Should have found exactly one element');
});

test.failing('subscribe to element that eventually matches a complex selcetor: +, first added second', async t => {
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

	for await (const element of readyElements) {
		t.is(element.id, secondId);
		readyElementsCount++;
	}

	t.is(readyElementsCount, 1, 'Should have found exactly one element');
});

test('subscribe to elements that eventually match a complex selector: ~', async t => {
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

	for await (const element of readyElements) {
		t.is(element.id, secondId);
		readyElementsCount++;
	}

	t.is(readyElementsCount, 1, 'Should have found exactly one element');
});

test.failing('subscribe to elements that eventually match a predicate', async t => {
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

	for await (const element of readyElements) {
		t.is(element.textContent, 'penguin');
		readyElementsCount++;
	}

	t.is(readyElementsCount, 1, 'Should have found exactly one element');
});

test.failing('subscribe to elements with eventually matching character data', async t => {
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

	for await (const element of readyElements) {
		t.is(element.textContent, 'penguin');
		readyElementsCount++;
	}

	t.is(readyElementsCount, 1, 'Should have found exactly one element');
});
