import PCancelable from 'p-cancelable';

export interface Options {
	/**
	 * The element that's expected to contain a match.
	 *
	 * @default document
	 */
	readonly target?: HTMLElement | Document;
}

/**
 * Detect when an element is ready in the DOM.
 *
 * @param selector - [CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
 * @returns The matching element.
 */
export default function elementReady(
	selector: string,
	options?: Options
): PCancelable<HTMLElement>;
