// @flow
/* eslint-disable no-unused-expressions, no-unused-vars */

import elementReady, {type Options} from './index.js.flow';

elementReady('#unicorn');
elementReady('#unicorn', null);
elementReady('#unicorn', {});
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.createElement('div')});
elementReady('#unicorn', {target: document.createDocumentFragment()});

(async (): Promise<void> => {
	const element: HTMLElement = await elementReady('#unicorn');
})();

({target: document}: Options);

// $ExpectError
elementReady(1);
// $ExpectError
elementReady(true);
// $ExpectError
elementReady({});
// $ExpectError
elementReady('#unicorn', {target: null});
// $ExpectError
elementReady('#unicorn', {target: 1});
// $ExpectError
elementReady('#unicorn', {target: {}});
// $ExpectError
elementReady('#unicorn', {unknownProperty: ''});

// $ExpectError
({target: null}: Options);
// $ExpectError
({target: 1}: Options);
// $ExpectError
({target: {}}: Options);
// $ExpectError
({unknownProperty: ''}: Options);
