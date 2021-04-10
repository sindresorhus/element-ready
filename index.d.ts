/* eslint-disable import/export */
import type {ParseSelector} from 'typed-query-selector/parser';

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
