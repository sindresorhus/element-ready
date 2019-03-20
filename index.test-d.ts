import {expectType} from 'tsd-check';
import PCancelable from 'p-cancelable';
import elementReady from '.';

const promise = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});

expectType<PCancelable<null>>(promise);
expectType<PCancelable<Element>>(promise);
expectType<PCancelable<HTMLDivElement>>(elementReady('div'));
expectType<PCancelable<SVGElement>>(elementReady('text'));

promise.cancel();
