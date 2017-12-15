import test from 'ava';
import jsdom from 'jsdom';
import delay from 'delay';
import PCancelable from 'p-cancelable';
import m from '.';

const dom = new jsdom.JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.requestAnimationFrame = fn => setTimeout(fn, 16);
global.cancelAnimationFrame = id => clearTimeout(id);

test('check if element ready', async t => {
	const elCheck = m('#unicorn');

	delay(500).then(() => {
		const el = document.createElement('p');
		el.id = 'unicorn';
		document.body.appendChild(el);
	});

	const el = await elCheck;
	t.is(el.id, 'unicorn');
});

test('check if element ready inside target', async t => {
	const target = document.createElement('p');
	const elCheck = m('#unicorn', {
		target
	});

	delay(500).then(() => {
		const el = document.createElement('p');
		el.id = 'unicorn';
		target.appendChild(el);
	});

	const el = await elCheck;
	t.is(el.id, 'unicorn');
});

test('check if different elements ready inside different targets with same selector', async t => {
	const target1 = document.createElement('p');
	const elCheck1 = m('.unicorn', {
		target: target1
	});
	const target2 = document.createElement('span');
	const elCheck2 = m('.unicorn', {
		target: target2
	});

	delay(500).then(() => {
		const el1 = document.createElement('p');
		el1.id = 'unicorn1';
		el1.className = 'unicorn';
		target1.appendChild(el1);

		const el2 = document.createElement('span');
		el2.id = 'unicorn2';
		el2.className = 'unicorn';
		target2.appendChild(el2);
	});

	const el1 = await elCheck1;
	t.is(el1.id, 'unicorn1');

	const el2 = await elCheck2;
	t.is(el2.id, 'unicorn2');
});

test('ensure only one promise is returned on multiple calls passing the same selector', t => {
	const elCheck = m('#unicorn');

	for (let i = 0; i <= 10; i++) {
		if (m('#unicorn') !== elCheck) {
			t.fail();
		}
	}

	t.pass();
});

test('check if wait can be canceled', async t => {
	const elCheck = m('#dofle');

	await delay(200);
	elCheck.cancel();

	await delay(500);
	const el = document.createElement('p');
	el.id = 'dofle';
	document.body.appendChild(el);

	await t.throws(elCheck, PCancelable.CancelError);
});

test('ensure different promises are returned on second call with the same selector when first was canceled', async t => {
	const elCheck1 = m('.unicorn');

	elCheck1.cancel();

	const elCheck2 = m('.unicorn');

	await t.throws(elCheck1, PCancelable.CancelError);
	t.not(elCheck1, elCheck2);
});
