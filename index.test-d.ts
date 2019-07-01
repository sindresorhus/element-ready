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


const {stop} = elementReady.subscribe(".unicorn", e => null);
elementReady.subscribe(".unicorn", e => null, {target: document});
elementReady.subscribe(".unicorn", e => null, {target: document.documentElement});
elementReady.subscribe(".unicorn", e => null, {stopOnDomReady: false});

elementReady.subscribe(".unicorn", e => expectType<Element>(e));
elementReady.subscribe("div", e => expectType<HTMLDivElement>(e));
elementReady.subscribe("text", e => expectType<SVGElement>(e));

expectType<() => any>(stop);

promise.stop();
stop();
