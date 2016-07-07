import test from 'ava';
import jsdom from 'jsdom';
import delay from 'delay';
import m from './';

global.document = jsdom.jsdom();
global.window = document.defaultView;

test(async t => {
	const elCheck = m('#unicorn');

	// multiple calls
	m('#unicorn');
	m('#unicorn');
	m('#unicorn');
	m('#unicorn');

	delay(500).then(() => {
		const el = document.createElement('p');
		el.id = 'unicorn';
		document.body.appendChild(el);
	});

	const el = await elCheck;
	t.is(el.id, 'unicorn');
});
