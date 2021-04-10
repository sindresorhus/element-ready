/* eslint-disable @typescript-eslint/no-floating-promises */
import {expectType} from 'tsd';
import elementReady, {StoppablePromise} from './index.js';

const promise = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});
elementReady('#unicorn', {timeout: 1000000});

elementReady('#unicorn', {stopOnDomReady: false});

expectType<StoppablePromise<HTMLElement | undefined>>(promise);
expectType<StoppablePromise<HTMLDivElement | undefined>>(elementReady('div'));
expectType<StoppablePromise<SVGTextElement | undefined>>(elementReady('text'));

expectType<StoppablePromise<HTMLElement | undefined>>(elementReady('.class'));
expectType<StoppablePromise<HTMLDivElement | undefined>>(elementReady('div.class'));
expectType<StoppablePromise<HTMLAnchorElement | undefined>>(elementReady('a#id'));
expectType<StoppablePromise<HTMLInputElement | undefined>>(elementReady('input[type="checkbox"]'));
expectType<StoppablePromise<HTMLButtonElement | undefined>>(elementReady(':root > button'));

promise.stop();
