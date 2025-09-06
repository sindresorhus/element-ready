import {setTimeout as delay} from 'node:timers/promises';
import test from 'ava';
import {JSDOM} from 'jsdom';
import {promiseStateSync} from 'p-state';
import elementReady, {observeReadyElements} from './index.js';

const {window} = new JSDOM();
globalThis.window = window;
globalThis.document = window.document;
globalThis.MutationObserver = window.MutationObserver;

test('check if element ready', async t => {
	const elementCheck = elementReady('#unicorn', {stopOnDomReady: false});

	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = 'unicorn';
		document.body.append(element);
	})();

	const element = await elementCheck;
	t.is(element.id, 'unicorn');
});

test('check elements against a predicate', async t => {
	const elementCheck = elementReady('li', {
		stopOnDomReady: false,
		predicate: element => element.textContent && element.textContent.match(/wanted/i),
	});

	(async () => {
		await delay(500);
		const listElement = document.createElement('ul');
		for (const text of ['some text', 'wanted text']) {
			const li = document.createElement('li');
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
	const elementCheck = elementReady('#unicorn', {
		target,
		stopOnDomReady: false,
	});

	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = 'unicorn';
		target.append(element);
	})();

	const element = await elementCheck;
	t.is(element.id, 'unicorn');
});

test('check if different elements ready inside different targets with same selector', async t => {
	const target1 = document.createElement('p');
	const elementCheck1 = elementReady('.unicorn', {
		target: target1,
		stopOnDomReady: false,
	});
	const target2 = document.createElement('span');
	const elementCheck2 = elementReady('.unicorn', {
		target: target2,
		stopOnDomReady: false,
	});

	(async () => {
		await delay(500);
		const element1 = document.createElement('p');
		element1.id = 'unicorn1';
		element1.className = 'unicorn';
		target1.append(element1);

		const element2 = document.createElement('span');
		element2.id = 'unicorn2';
		element2.className = 'unicorn';
		target2.append(element2);
	})();

	const element1 = await elementCheck1;
	t.is(element1.id, 'unicorn1');

	const element2 = await elementCheck2;
	t.is(element2.id, 'unicorn2');
});

test('check if element ready after dom loaded', async t => {
	const elementCheck = elementReady('#bio', {
		stopOnDomReady: true,
	});

	// The element will be added eventually, but we're not around to wait for it
	setTimeout(() => {
		const element = document.createElement('p');
		element.id = 'bio';
		document.body.append(element);
	}, 50_000);

	const element = await elementCheck;
	t.is(element, undefined);
});

test('check if element ready before dom loaded', async t => {
	const element = document.createElement('p');
	element.id = 'history';
	document.body.append(element);

	const elementCheck = elementReady('#history', {
		stopOnDomReady: true,
	});

	t.is(await elementCheck, element);
});

test('stop checking if DOM was already ready', async t => {
	const elementCheck = elementReady('#no-gonna-get-us', {
		stopOnDomReady: true,
	});

	t.is(await elementCheck, undefined);
});

test('check if element ready after timeout', async t => {
	const elementCheck = elementReady('#cheezburger', {
		stopOnDomReady: false,
		signal: AbortSignal.timeout(1000),
	});

	// The element will be added eventually, but we're not around to wait for it
	const timeoutId = setTimeout(() => {
		const element = document.createElement('p');
		element.id = 'cheezburger';
		document.body.append(element);
	}, 50_000);

	const element = await elementCheck;
	t.is(element, undefined);
	clearTimeout(timeoutId);
});

test('check if element ready before timeout', async t => {
	const element = document.createElement('p');
	element.id = 'thunders';
	document.body.append(element);

	const elementCheck = elementReady('#thunders', {
		stopOnDomReady: false,
		signal: AbortSignal.timeout(10),
	});

	t.is(await elementCheck, element);
});

test('check if wait can be stopped', async t => {
	const controller = new AbortController();

	const elementCheck = elementReady('#dofle', {stopOnDomReady: false, signal: controller.signal});

	await delay(200);
	controller.abort();

	await delay(500);
	const element = document.createElement('p');
	element.id = 'dofle';
	document.body.append(element);

	t.is(await elementCheck, undefined);
});

test('ensure different promises are returned on second call with the same selector when first was stopped', async t => {
	const controller = new AbortController();

	const elementCheck1 = elementReady('.unicorn', {stopOnDomReady: false, signal: controller.signal});

	controller.abort();

	const elementCheck2 = elementReady('.unicorn', {stopOnDomReady: false});

	t.not(elementCheck1, elementCheck2);
	t.is(await elementCheck1, undefined);
});

test('ensure different promises are returned on second call with the same selector when first was found', async t => {
	const prependElement = () => {
		const element = document.createElement('p');
		element.className = 'unicorn';
		document.body.prepend(element);
		return element;
	};

	t.is(prependElement(), await elementReady('.unicorn'));

	document.querySelector('.unicorn').remove();
	t.is(prependElement(), await elementReady('.unicorn'));

	document.querySelector('.unicorn').remove();
	t.is(prependElement(), await elementReady('.unicorn'));
});

test('ensure that the whole element has loaded', async t => {
	const {window} = new JSDOM('<nav class="loading-html-fixture">');
	const {document} = window;

	// Fake the pre-DOM-ready state
	Object.defineProperty(document, 'readyState', {
		get: () => 'loading',
	});

	const navigationElement = document.querySelector('nav');
	const partialCheck = elementReady('nav', {
		target: document,
		waitForChildren: false,
	});

	const entireCheck = elementReady('nav', {
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

test('subscribe to newly added elements that match a selector', async t => {
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = 'unicorn';
		document.body.append(element);

		const element2 = document.createElement('p');
		element2.id = 'unicorn';
		document.body.append(element2);

		await delay(500);

		const element3 = document.createElement('p');
		element3.id = 'unicorn3';
		document.body.append(element3);
	})();

	const readyElements = observeReadyElements('#unicorn, #unicorn3', {stopOnDomReady: false});
	let readyElementsCount = 0;

	for await (const element of readyElements) {
		readyElementsCount++;
		t.is(element.id, 'unicorn');

		if (readyElementsCount === 2) {
			break;
		}
	}

	for await (const element of readyElements) {
		readyElementsCount++;
		t.is(element.id, 'unicorn3');

		if (readyElementsCount === 3) {
			break;
		}
	}
});

test('subscribe to newly added elements that match a predicate', async t => {
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.textContent = 'unicorn';
		document.body.append(element);

		const element2 = document.createElement('p');
		element2.textContent = 'horse';
		document.body.append(element2);

		await delay(500);

		const element3 = document.createElement('p');
		element3.textContent = 'penguin';
		document.body.append(element3);
	})();

	const readyElements = observeReadyElements('p', {
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

test('subscribe to newly added elements that match one of multiple selectors', async t => {
	(async () => {
		await delay(500);
		const element = document.createElement('p');
		element.id = 'unicorn';
		document.body.append(element);
		await delay(500);
		const element2 = document.createElement('div');
		element2.id = 'dragon';
		document.body.append(element2);
	})();

	const readyElements = observeReadyElements(['#unicorn', '#dragon'], {stopOnDomReady: false});

	const readyElementIds = [];

	for await (const element of readyElements) {
		readyElementIds.push(element.id);

		if (readyElementIds.length === 2) {
			break;
		}
	}

	t.deepEqual(readyElementIds, ['unicorn', 'dragon'], 'should catch elements matching either selector');
});
