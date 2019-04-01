/// <reference lib="dom"/>
import PCancelable = require('p-cancelable');

declare namespace elementReady {
	interface Options {
		/**
		The element that's expected to contain a match.

		@default document
		*/
		readonly target?: Element | Document;
	}
}

/**
Detect when an element is ready in the DOM.

@param selector - [CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
@returns The matching element.

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
): PCancelable<HTMLElementTagNameMap[ElementName]>;
declare function elementReady<ElementName extends keyof SVGElementTagNameMap>(
	selector: ElementName,
	options?: elementReady.Options
): PCancelable<SVGElementTagNameMap[ElementName]>;
declare function elementReady<ElementName extends Element = Element>(
	selector: string,
	options?: elementReady.Options
): PCancelable<ElementName>;
export = elementReady;
