import {expectType} from 'tsd';
import elementReady = require('.');

const promise = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});

expectType<elementReady.PStoppable<Element | undefined>>(promise);
expectType<elementReady.PStoppable<HTMLDivElement | undefined>>(elementReady('div'));
expectType<elementReady.PStoppable<SVGElement | undefined>>(elementReady('text'));

promise.stop();
