/// <reference lib="dom"/>

declare namespace elementReady {
	interface Options {
		/**
		The element that's expected to contain a match.

		@default document
		*/
		readonly target?: Element | Document;

		/**
		The time to wait before stopping the search, in milliseconds. 0 disables it.

		@default false
		*/
		readonly timeout?: number | false
	}

	type StoppablePromise<T> = Promise<T> & {
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
