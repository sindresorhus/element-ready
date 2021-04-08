import {expectType} from 'tsd';
import elementReady = require('.');

const promise = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});
elementReady('#unicorn', {timeout: 1000000});

elementReady('#unicorn', {stopOnDomReady: false});

expectType<elementReady.StoppablePromise<HTMLElement | undefined>>(promise);
expectType<elementReady.StoppablePromise<HTMLDivElement | undefined>>(elementReady('div'));
expectType<elementReady.StoppablePromise<SVGTextElement | undefined>>(elementReady('text'));

expectType<elementReady.StoppablePromise<HTMLElement | undefined>>(elementReady('.class'));
expectType<elementReady.StoppablePromise<HTMLDivElement | undefined>>(elementReady('div.class'));
expectType<elementReady.StoppablePromise<HTMLAnchorElement | undefined>>(elementReady('a#id'));
expectType<elementReady.StoppablePromise<HTMLInputElement | undefined>>(elementReady('input[type="checkbox"]'));
expectType<elementReady.StoppablePromise<HTMLButtonElement | undefined>>(elementReady(':root > button'));

promise.stop();
