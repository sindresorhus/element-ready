# element-ready [![Build Status](https://travis-ci.org/sindresorhus/element-ready.svg?branch=master)](https://travis-ci.org/sindresorhus/element-ready)

> Detect when an element is ready in the DOM


## Install

```
$ npm install element-ready
```


## Usage

```js
const elementReady = require('element-ready');

(async () => {
	const element = await elementReady('#unicorn');

	console.log(element.id);
	//=> 'unicorn'

	elementReady.subscribe('.rainbow', element => {
		console.log(element.classList);
		//=> ['rainbow',...]
	});
})();
```


## API

### elementReady(selector, options?)

Returns a promise for a matching element.

#### selector

Type: `string`

[CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)

#### options

Type: `object`

##### target

Type: `Element | document`<br>
Default: `document`

The element that's expected to contain a match.

##### stopOnDomReady

Type: `boolean`<br>
Default: `true`

Automatically stop checking for the element to be ready after the [DOM ready event](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event). The promise is then resolved to `undefined`.

##### timeout

Type: `number`<br>
Default: `Infinity`

Milliseconds to wait before stopping the search and resolving the promise to `undefined`.

### elementReadyPromise#stop()

Type: `Function`

Stop checking for the element to be ready. The stop is synchronous and the original promise is then resolved to `undefined`.

Calling it after the promise has settled or multiple times does nothing.

<hr>

### elementReady.subscribe(selector, callback, options?)

Detect elements as they are added to the DOM.

Returns a stoppable to cancel subscription.

#### selector

Type: `string`

[CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)

#### callback

Type: `Function`<br>
Signature: `(element: Element) => void`

Callback function to be called on each one of the discovered elements.

#### options

##### target

Type: `Element | document`<br>
Default: `document`

The element that's expected to contain a match.

##### stopOnDomReady

Type: `boolean`<br>
Default: `true`

Automatically stop searching for new elements after the [DOM ready event](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event).

If this is true, and `subscribe` function is being called after the DOM ready event, it just detects the elements that are currently in the DOM and then stops searching for new elements immediately.

##### timeout

Type: `number`<br>
Default: `Infinity`

Milliseconds to wait before stopping the search.

### stoppable#stop()

Type: `Function`

Stop checking for new elements.

Calling it multiple times does nothing.

## Related

- [dom-loaded](https://github.com/sindresorhus/dom-loaded) - Check when the DOM is loaded like `DOMContentLoaded`
