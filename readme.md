# element-ready [![Build Status](https://travis-ci.org/sindresorhus/element-ready.svg?branch=master)](https://travis-ci.org/sindresorhus/element-ready)

> Detect when an element is ready in the DOM


## Install

```
$ npm install element-ready
```


## Usage

```js
const elementReady = require('element-ready');

elementReady('#unicorn').then(element => {
	console.log(element.id);
	//=> 'unicorn'
});
```


## API

### elementReady(selector, [options])

Returns a promise for a matching element.

#### selector

Type: `string`

[CSS selector.](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)

#### options

Type: `Object`

##### target

Type: `Element` `document`<br>
Default: `document`

The element that's expected to contain a match.

### elementReadyPromise#cancel()

Type: `Function`

Stops checking for the element to be ready. The cancelation is synchronous.

Calling it after the promise has settled or multiple times does nothing.

Based on [p-cancelable](https://github.com/sindresorhus/p-cancelable).


## Related

- [dom-loaded](https://github.com/sindresorhus/dom-loaded) - Check when the DOM is loaded like `DOMContentLoaded`


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
