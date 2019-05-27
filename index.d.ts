/// <reference lib="dom"/>

declare namespace elementReady {
	interface Options {
		/**
		The element that's expected to contain a match.

		@default document
		*/
		readonly target?: Element | Document;

		/**
		Milliseconds to wait before stopping the search and resolving the promise to `undefined`.

		@default Infinity
		*/
		readonly timeout?: number

		/**
		Automatically stop checking for the element to be ready after the DOM ready event. The promise is then resolved to `undefined`.

		@default true
		*/
		readonly stopOnDomReady?: boolean;
	}

	type StoppablePromise<T> = Promise<T> & {
		/**
		Stop checking for the element to be ready. The stop is synchronous and the original promise is then resolved to `undefined`.

		Calling it after the promise has settled or multiple times does nothing.
		*/
		stop(): void;
	}
}

/**
Detect when an element is ready in the DOM.

@param selector - [CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
@returns The matching element, or `undefined` if the element could not be found.

@example
```
import elementReady = require('element-ready');

(async () => {
	const element = await elementReady('#unicorn');

	console.log(element.id);
	//=> 'unicorn'
})();
```
*/
declare function elementReady<ElementName extends keyof HTMLElementTagNameMap>(
	selector: ElementName,
	options?: elementReady.Options
): elementReady.StoppablePromise<HTMLElementTagNameMap[ElementName] | undefined>;
declare function elementReady<ElementName extends keyof SVGElementTagNameMap>(
	selector: ElementName,
	options?: elementReady.Options
): elementReady.StoppablePromise<SVGElementTagNameMap[ElementName] | undefined>;
declare function elementReady<ElementName extends Element = Element>(
	selector: string,
	options?: elementReady.Options
): elementReady.StoppablePromise<ElementName | undefined>;
export = elementReady;
