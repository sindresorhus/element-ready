import {expectType} from 'tsd';
import PCancelable = require('p-cancelable');
import elementReady = require('.');

const promise = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});

expectType<PCancelable<Element | undefined>>(promise);
expectType<PCancelable<HTMLDivElement | undefined>>(elementReady('div'));
expectType<PCancelable<SVGElement | undefined>>(elementReady('text'));

promise.cancel();
