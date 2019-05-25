import {expectType} from 'tsd';
import elementReady = require('.');

const promise = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});

expectType<elementReady.StoppablePromise<Element | undefined>>(promise);
expectType<elementReady.StoppablePromise<HTMLDivElement | undefined>>(elementReady('div'));
expectType<elementReady.StoppablePromise<SVGElement | undefined>>(elementReady('text'));

promise.stop();
