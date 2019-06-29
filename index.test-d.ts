import {expectType} from 'tsd';
import elementReady = require('.');

elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});
elementReady('#unicorn', {timeout: 1000000});
elementReady('#unicorn', {stopOnDomReady: false});
elementReady('#unicorn', {cancellable: false});

expectType<elementReady.StoppablePromise<Element | undefined>>(elementReady('#unicorn'));
expectType<elementReady.StoppablePromise<Element | undefined>>(elementReady('#unicorn', {cancellable: true}));
expectType<elementReady.StoppablePromise<HTMLDivElement | undefined>>(elementReady('div'));
expectType<elementReady.StoppablePromise<SVGElement | undefined>>(elementReady('text'));

expectType<Promise<Element | never>>(elementReady('#unicorn', {cancellable: false}));
expectType<Promise<HTMLDivElement | never>>(elementReady('div', {cancellable: false}));
expectType<Promise<SVGElement | never>>(elementReady('text', {cancellable: false}));
