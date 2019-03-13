import test from 'ava';
import jsdom from 'jsdom';
import delay from 'delay';
import PCancelable from 'p-cancelable';
import elementReady from '.';

const dom = new jsdom.JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.requestAnimationFrame = fn => setTimeout(fn, 16);
global.cancelAnimationFrame = id => clearTimeout(id);

test('check if element ready', async t => {
	const elementCheck = elementReady('#unicorn');

	delay(500).then(() => {
		const element = document.createElement('p');
		element.id = 'unicorn';
		document.body.append(element);
	});

	const element = await elementCheck;
	t.is(element.id, 'unicorn');
});

test('check if element ready inside target', async t => {
	const target = document.createElement('p');
	const elCheck = elementReady('#unicorn', {
		target
	});

	delay(500).then(() => {
		const element = document.createElement('p');
		element.id = 'unicorn';
		target.append(element);
	});

	const element = await elCheck;
	t.is(element.id, 'unicorn');
});

test('check if different elements ready inside different targets with same selector', async t => {
	const target1 = document.createElement('p');
	const elementCheck1 = elementReady('.unicorn', {
		target: target1
	});
	const target2 = document.createElement('span');
	const elementCheck2 = elementReady('.unicorn', {
		target: target2
	});

	delay(500).then(() => {
		const element1 = document.createElement('p');
		element1.id = 'unicorn1';
		element1.className = 'unicorn';
		target1.append(element1);

		const element2 = document.createElement('span');
		element2.id = 'unicorn2';
		element2.className = 'unicorn';
		target2.append(element2);
	});

	const element1 = await elementCheck1;
	t.is(element1.id, 'unicorn1');

	const element2 = await elementCheck2;
	t.is(element2.id, 'unicorn2');
});

test('ensure only one promise is returned on multiple calls passing the same selector', t => {
	const elementCheck = elementReady('#unicorn');

	for (let i = 0; i <= 10; i++) {
		if (elementReady('#unicorn') !== elementCheck) {
			t.fail();
		}
	}

	t.pass();
});

test('check if wait can be canceled', async t => {
	const elementCheck = elementReady('#dofle');

	await delay(200);
	elementCheck.cancel();

	await delay(500);
	const element = document.createElement('p');
	element.id = 'dofle';
	document.body.append(element);

	await t.throwsAsync(elementCheck, PCancelable.CancelError);
});

test('ensure different promises are returned on second call with the same selector when first was canceled', async t => {
	const elementCheck1 = elementReady('.unicorn');

	elementCheck1.cancel();

	const elementCheck2 = elementReady('.unicorn');

	await t.throwsAsync(elementCheck1, PCancelable.CancelError);
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
