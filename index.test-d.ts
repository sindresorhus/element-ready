import {expectType} from 'tsd';
import elementReady = require('.');

elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});
elementReady('#unicorn', {timeout: 1000000});

elementReady('#unicorn', {stopOnDomReady: false});

expectType<elementReady.StoppablePromise<Element | never>>(elementReady('#unicorn'));
expectType<elementReady.StoppablePromise<Element | undefined>>(elementReady('#unicorn', {timeout: 100}));

expectType<elementReady.StoppablePromise<HTMLDivElement | never>>(elementReady('div'));
expectType<elementReady.StoppablePromise<HTMLDivElement | undefined>>(elementReady('div', {timeout: 100}));

expectType<elementReady.StoppablePromise<SVGElement | never>>(elementReady('text'));
expectType<elementReady.StoppablePromise<SVGElement | undefined>>(elementReady('text', {timeout: 100}));
