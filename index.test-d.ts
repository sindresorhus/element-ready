/* eslint-disable @typescript-eslint/no-floating-promises */
import {expectType} from 'tsd';
import elementReady, {observeReadyElements} from './index.js';

const promise = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});

const controller = new AbortController();

elementReady('#unicorn', {signal: controller.signal});

elementReady('#unicorn', {stopOnDomReady: false});

expectType<Promise<HTMLElement | undefined>>(promise);
expectType<Promise<HTMLDivElement | undefined>>(elementReady('div'));
expectType<Promise<SVGTextElement | undefined>>(elementReady('text'));

expectType<Promise<HTMLElement | undefined>>(elementReady('.class'));
expectType<Promise<HTMLDivElement | undefined>>(elementReady('div.class'));
expectType<Promise<HTMLAnchorElement | undefined>>(elementReady('a#id'));
expectType<Promise<HTMLInputElement | undefined>>(elementReady('input[type="checkbox"]'));
expectType<Promise<HTMLButtonElement | undefined>>(elementReady(':root > button'));

const readyElements = observeReadyElements('#unicorn');

expectType<AsyncIterable<HTMLElement>>(readyElements);
