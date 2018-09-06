// @flow
import elementReady from './index.js.flow';

elementReady('#unicorn');
elementReady('#unicorn', null);
elementReady('#unicorn', {});
elementReady('#unicorn', {target: null});
elementReady('#unicorn', {target: document.body});
elementReady('#unicorn', {target: document.createElement('div')});

(async (): Promise<void> => {
	// eslint-disable-next-line no-unused-vars
	const element: HTMLElement = await elementReady('#unicorn');
})();

// $ExpectError
elementReady(1);
// $ExpectError
elementReady(true);
// $ExpectError
elementReady({});
