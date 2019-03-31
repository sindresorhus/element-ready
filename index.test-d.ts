import {expectType} from 'tsd';
import PCancelable = require('p-cancelable');
import elementReady = require('.');

const promise = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});

expectType<PCancelable<Element>>(promise);
expectType<PCancelable<HTMLDivElement>>(elementReady('div'));
expectType<PCancelable<SVGElement>>(elementReady('text'));

promise.cancel();
