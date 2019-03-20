import PCancelable from 'p-cancelable';

export interface Options {
	/**
	The element that's expected to contain a match.

	@default document
	*/
	readonly target?: Element | Document;
}

/**
Detect when an element is ready in the DOM.

@param selector - [CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
@returns The matching element.
*/
export default function elementReady<
	ElementName extends keyof HTMLElementTagNameMap
>(
	selector: ElementName,
	options?: Options
): PCancelable<HTMLElementTagNameMap[ElementName] | null>;
export default function elementReady<
	ElementName extends keyof SVGElementTagNameMap
>(
	selector: ElementName,
	options?: Options
): PCancelable<SVGElementTagNameMap[ElementName] | null>;
export default function elementReady<ElementName extends Element = Element>(
	selector: string,
	options?: Options
): PCancelable<ElementName | null>;
