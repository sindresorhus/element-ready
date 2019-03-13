import {expectType} from 'tsd-check';
import PCancelable from 'p-cancelable';
import elementReady from '.';

const p = elementReady('#unicorn');
elementReady('#unicorn', {target: document});
elementReady('#unicorn', {target: document.documentElement});

expectType<PCancelable<Element>>(p);
expectType<PCancelable<HTMLDivElement>>(elementReady('div'));
expectType<PCancelable<SVGElement>>(elementReady('text'));

p.cancel();
