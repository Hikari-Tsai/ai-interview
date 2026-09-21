import test from 'node:test';
import assert from 'node:assert/strict';
import {historyFor,recordVisit} from '../src/lib/history.ts';
test('visits survive mode changes and navigate backward then forward',()=>{
 const initial=historyFor(undefined,'same-filter','Q0001');
 const second=recordVisit(initial,'Q0002','next');
 const retained=historyFor(second,'same-filter','Q0002');
 assert.deepEqual(retained.ids,['Q0001','Q0002']);
 const back=recordVisit(retained,'Q0001','previous');assert.equal(back.cursor,0);
 const forward=recordVisit(back,'Q0002','next');assert.equal(forward.cursor,1);assert.equal(forward.ids.length,2);
});
test('changing eligible scope starts fresh history',()=>{
 assert.deepEqual(historyFor({key:'rag',ids:['Q0001','Q0002'],cursor:1},'llm','Q0003'),{key:'llm',ids:['Q0003'],cursor:0});
});
