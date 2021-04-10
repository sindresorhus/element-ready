import test from 'ava';
import delay from 'delay';
import {JSDOM} from 'jsdom';
import {promiseStateSync} from 'p-state';
import elementReady from './index.js';

const {window} = new JSDOM();
global.window = window;
global.document = window.document;
global.requestAnimationFrame = fn => setTimeout(fn, 16);
global.cancelAnimationFrame = id => clearTimeout(id);

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

test('check if element ready inside target', async t => {
	const target = document.createElement('p');
	const elementCheck = elementReady('#unicorn', {
		target,
		stopOnDomReady: false
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
		stopOnDomReady: false
	});
	const target2 = document.createElement('span');
	const elementCheck2 = elementReady('.unicorn', {
		target: target2,
		stopOnDomReady: false
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
		stopOnDomReady: true
	});

	// The element will be added eventually, but we're not around to wait for it
	setTimeout(() => {
		const element = document.createElement('p');
		element.id = 'bio';
		document.body.append(element);
	}, 50000);

	const element = await elementCheck;
	t.is(element, undefined);
});

test('check if element ready before dom loaded', async t => {
	const element = document.createElement('p');
	element.id = 'history';
	document.body.append(element);

	const elementCheck = elementReady('#history', {
		stopOnDomReady: true
	});

	t.is(await elementCheck, element);
});

test('check if element ready after timeout', async t => {
	const elementCheck = elementReady('#cheezburger', {
		stopOnDomReady: false,
		timeout: 1000
	});

	// The element will be added eventually, but we're not around to wait for it
	setTimeout(() => {
		const element = document.createElement('p');
		element.id = 'cheezburger';
		document.body.append(element);
	}, 50000);

	const element = await elementCheck;
	t.is(element, undefined);
});

test('check if element ready before timeout', async t => {
	const element = document.createElement('p');
	element.id = 'thunders';
	document.body.append(element);

	const elementCheck = elementReady('#thunders', {
		stopOnDomReady: false,
		timeout: 10
	});

	t.is(await elementCheck, element);
});

test('ensure only one promise is returned on multiple calls passing the same selector', t => {
	const elementCheck = elementReady('#not-found', {stopOnDomReady: false});

	for (let i = 0; i <= 10; i++) {
		if (elementReady('#not-found', {stopOnDomReady: false}) !== elementCheck) {
			t.fail();
		}
	}

	t.pass();
});

test('check if wait can be stopped', async t => {
	const elementCheck = elementReady('#dofle', {stopOnDomReady: false});

	await delay(200);
	elementCheck.stop();

	await delay(500);
	const element = document.createElement('p');
	element.id = 'dofle';
	document.body.append(element);

	t.is(await elementCheck, undefined);
});

test('ensure different promises are returned on second call with the same selector when first was stopped', async t => {
	const elementCheck1 = elementReady('.unicorn', {stopOnDomReady: false});

	elementCheck1.stop();

	const elementCheck2 = elementReady('.unicorn', {stopOnDomReady: false});

	t.is(await elementCheck1, undefined);

	t.not(elementCheck1, elementCheck2);
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
		get: () => 'loading'
	});

	const nav = document.querySelector('nav');
	const partialCheck = elementReady('nav', {
		target: document,
		waitForChildren: false
	});

	const entireCheck = elementReady('nav', {
		target: document,
		waitForChildren: true
	});

	t.is(await partialCheck, nav, '<nav> appears in the loading document, so it should be found whether it’s loaded fully or not');
	const expectation = 'elementReady can’t guarantee the element has loaded in full';
	t.is(promiseStateSync(entireCheck), 'pending', expectation);

	nav.innerHTML = '<ul><li>Home</li><li>About</li></ul>';
	t.is(promiseStateSync(entireCheck), 'pending', expectation);

	nav.insertAdjacentHTML('beforebegin', '<h1>Site title</h1>');
	t.is(promiseStateSync(entireCheck), 'pending', expectation);

	nav.after('Some other part of the page, even a text node');
	t.is(await entireCheck, await partialCheck, 'Something appears after <nav>, so it’s guaranteed that it loaded in full');
});
