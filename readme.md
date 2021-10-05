# element-ready

> Detect when an element is ready in the DOM

## Install

```
$ npm install element-ready
```

## Usage

```js
import elementReady from 'element-ready';

const element = await elementReady('#unicorn');

console.log(element.id);
//=> 'unicorn'
```

## API

### elementReady(selector, options?)

Returns a promise for a matching element.

### observeReadyElements(selector, options?)

Returns an async iterable which yields with each new matching element. Useful for user-scripts that modify elements when they are added.

```js
import {observeReadyElements} from 'element-ready';

for await (const element of observeReadyElements('#unicorn')) {
	console.log(element.id);
	//=> 'unicorn'

	if (element.id === 'elephant') {
		break;
	}
}
```

#### selector

Type: `string`

[CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)

Prefix the element type to get a better TypeScript return type. For example, `button.my-btn` instead of `.my-btn`.

#### options

Type: `object`

##### target

Type: `Element | document`\
Default: `document`

The element that's expected to contain a match.

##### stopOnDomReady

Type: `boolean`\
Default: `true`

Automatically stop checking for the element to be ready after the [DOM ready event](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event). The promise is then resolved to `undefined`.

##### timeout

Type: `number`\
Default: `Infinity`

Milliseconds to wait before stopping the search and resolving the promise to `undefined`.

##### waitForChildren

Type: `boolean`\
Default: `true`

Since the current document’s HTML is downloaded and parsed gradually, elements may appear in the DOM before _all_ of their children are “ready”.

By default, `element-ready` guarantees the element and all of its children have been parsed. This is useful if you want to interact with them or if you want to `.append()` something inside.

By setting this to `false`, `element-ready` will resolve the promise as soon as it finds the requested selector, regardless of its content. This is ok if you're just checking if the element exists or if you want to read/change its attributes.

##### predicate

Type: `(element: HTMLElement) => boolean`\
Default: `undefined`

A predicate function will be called for each element that matches the selector. If it returns `true`, the element will be returned.

For example, if the content is dynamic or a selector cannot be specific enough, you could check `.textContent` of each element and only match the one that has the required text.

```html
<ul id="country-list">
	<li>country a</li>
	...
	<li>wanted country</li>
	...
</ul>
```

```js
import elementReady from 'element-ready';

const wantedCountryElement = await elementReady('#country-list li', {
	predicate: listItemElement => listItemElement.textContent === 'wanted country'
});
```

### elementReadyPromise#stop()

Type: `Function`

Stop checking for the element to be ready. The stop is synchronous and the original promise is then resolved to `undefined`.

Calling it after the promise has settled or multiple times does nothing.

## Related

- [dom-loaded](https://github.com/sindresorhus/dom-loaded) - Check when the DOM is loaded like `DOMContentLoaded`
