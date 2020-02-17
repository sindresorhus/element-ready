import {expectType} from 'tsd';
import elementReady = require('.');

const promise = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});
elementReady('#unicorn', {timeout: 1000000});

elementReady('#unicorn', {stopOnDomReady: false});

expectType<elementReady.StoppablePromise<Element | undefined>>(promise);
expectType<elementReady.StoppablePromise<HTMLDivElement | undefined>>(elementReady('div'));
expectType<elementReady.StoppablePromise<SVGElement | undefined>>(elementReady('text'));


const {stop} = elementReady.subscribe('.unicorn', element => null);
elementReady.subscribe('.unicorn', element => null, {target: document});
elementReady.subscribe('.unicorn', element => null, {target: document.documentElement});
elementReady.subscribe('.unicorn', element => null, {stopOnDomReady: false});

elementReady.subscribe('.unicorn', element => {
	expectType<Element>(element);
});
elementReady.subscribe('div', element => {
	expectType<HTMLDivElement>(element);
});
elementReady.subscribe('text', element => {
	expectType<SVGElement>(element)
});

expectType<() => any>(stop);

promise.stop();
stop();
