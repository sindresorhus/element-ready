import type {ParseSelector} from 'typed-query-selector/parser.js';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- TODO: Fix in the next breaking version
export interface Options {
	/**
	The element that's expected to contain a match.

	@default document
	*/
	readonly target?: HTMLElement | Document;

	/**
	Milliseconds to wait before stopping the search and resolving the promise to `undefined`.

	@default Infinity
	*/
	readonly timeout?: number;

	/**
	Automatically stop checking for the element to be ready after the DOM ready event. The promise is then resolved to `undefined`.

	@default true
	*/
	readonly stopOnDomReady?: boolean;

	/**
	Since the current document’s HTML is downloaded and parsed gradually, elements may appear in the DOM before _all_ of their children are “ready”.

	By default, `element-ready` guarantees the element and all of its children have been parsed. This is useful if you want to interact with them or if you want to `.append()` something inside.

	By setting this to `false`, `element-ready` will resolve the promise as soon as it finds the requested selector, regardless of its content. This is ok if you're just checking if the element exists or if you want to read/change its attributes.

	@default true
	*/
	readonly waitForChildren?: boolean;

	/**
	A predicate function will be called for each element that matches the selector. If it returns `true`, the element will be returned.

	@default undefined

	For example, if the content is dynamic or a selector cannot be specific enough, you could check `.textContent` of each element and only match the one that has the required text.

	@example
	```html
	<ul id="country-list">
		<li>country a</li>
		...
		<li>wanted country</li>
		...
	</ul>
	```

	```
	import elementReady from 'element-ready';

	const wantedCountryElement = await elementReady('#country-list li', {
		predicate: listItemElement => listItemElement.textContent === 'wanted country'
	});
	```
	*/
	predicate?(element: HTMLElement): boolean;
}

export type StoppablePromise<T> = Promise<T> & {
	/**
	Stop checking for the element to be ready. The stop is synchronous and the original promise is then resolved to `undefined`.

	Calling it after the promise has settled or multiple times does nothing.
	*/
	stop(): void;
};

/**
Detect when an element is ready in the DOM.

@param selector - [CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors) Prefix the element type to get a better return type. For example, `button.my-btn` instead of `.my-btn`.
@returns The matching element, or `undefined` if the element could not be found.

@example
```
import elementReady from 'element-ready';

const element = await elementReady('#unicorn');

console.log(element.id);
//=> 'unicorn'
```
*/
export default function elementReady<Selector extends string, ElementName extends Element = ParseSelector<Selector, HTMLElement>>(
	selector: Selector,
	options?: Options
): StoppablePromise<ElementName | undefined>;
export default function elementReady<ElementName extends Element = HTMLElement>(
	selector: string,
	options?: Options
): StoppablePromise<ElementName | undefined>;

/**
Detect when elements are ready in the DOM.

Useful for user-scripts that modify elements when they are added.

@param selector - [CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors) Prefix the element type to get a better return type. For example, `button.my-btn` instead of `.my-btn`.
@returns An async iterable which yields with each new matching element.

@example
```
import {observeReadyElements} from 'element-ready';

for await (const element of observeReadyElements('#unicorn')) {
	console.log(element.id);
	//=> 'unicorn'

	if (element.id === 'elephant') {
		break;
	}
}
```
*/
export function observeReadyElements<Selector extends string, ElementName extends Element = ParseSelector<Selector, HTMLElement>>(
	selector: Selector,
	options?: Options
): AsyncIterable<ElementName>;
export function observeReadyElements<ElementName extends Element = HTMLElement>(
	selector: string,
	options?: Options
): AsyncIterable<ElementName>;
