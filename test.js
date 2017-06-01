import test from 'ava';
import jsdom from 'jsdom';
import delay from 'delay';
import m from '.';

global.document = jsdom.jsdom();
global.window = document.defaultView;
global.requestAnimationFrame = fn => setTimeout(fn, 16);

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

test('ensure only one promise is returned on multiple calls passing the same selector', t => {
	const elCheck = m('#unicorn');

	for (let i = 0; i <= 10; i++) {
		if (m('#unicorn') !== elCheck) {
			t.fail();
		}
	}

	t.pass();
});
