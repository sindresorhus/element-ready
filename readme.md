# element-ready

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

##### expectEntireElement

Type: `boolean`\
Default: `true`

Explicitly wait for the entire element to be loaded instead of just its opening HMTL tag. If this is set to `false`, a `elementReady('nav')` promise could resolve before the last menu item has been downloaded.

Note: This is unrelated to the loading of images, videos, scripts, etc. It only follows the loading of the current document.

### elementReadyPromise#stop()

Type: `Function`

Stop checking for the element to be ready. The stop is synchronous and the original promise is then resolved to `undefined`.

Calling it after the promise has settled or multiple times does nothing.

## Related

- [dom-loaded](https://github.com/sindresorhus/dom-loaded) - Check when the DOM is loaded like `DOMContentLoaded`
