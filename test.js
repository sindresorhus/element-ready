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
