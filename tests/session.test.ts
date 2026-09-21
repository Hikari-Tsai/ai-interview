import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCards, orderedIds, readFilters } from '../src/lib/session.ts';
import type { Card } from '../src/lib/types.ts';
const cards = [
 {id:'Q0003',number:3,tags:['rag','production'],companies:['OpenAI'],original:'Deploy a retrieval system',active:true},
 {id:'Q0001',number:1,tags:['llm'],companies:['Meta'],original:'Attention mechanism',active:true},
 {id:'Q0002',number:2,tags:['rag'],companies:['OpenAI'],original:'Chunking strategy',active:true},
 {id:'Q0004',number:4,tags:['rag'],companies:[],original:'Old',active:false},
] as Card[];
test('default order uses immutable question number and excludes retired cards',()=>{
 assert.deepEqual(orderedIds(filterCards(cards,readFilters(new URLSearchParams())), 'sequential', 1), ['Q0001','Q0002','Q0003']);
});
test('any and all filters produce different bounded decks',()=>{
 const base=readFilters(new URLSearchParams('tag=rag&tag=production'));
 assert.deepEqual(filterCards(cards,base).map(c=>c.id),['Q0003','Q0002']);
 assert.deepEqual(filterCards(cards,{...base,match:'all'}).map(c=>c.id),['Q0003']);
});
test('search handles localized titles and combines with company',()=>{
 const localized=[{...cards[0],answer:{locales:{'zh-TW':{title:'檢索系統'}}}}] as Card[];
 assert.equal(filterCards(localized,{...readFilters(new URLSearchParams()),search:'檢索',company:'OpenAI'}).length,1);
 assert.equal(filterCards(localized,{...readFilters(new URLSearchParams()),company:'Meta'}).length,0);
});
test('seeded random contains every eligible card once and is reproducible',()=>{
 const deck=filterCards(cards,readFilters(new URLSearchParams()));
 const first=orderedIds(deck,'random',234);
 assert.equal(new Set(first).size,3);
 assert.deepEqual(first,orderedIds(deck,'random',234));
 assert.deepEqual([...first].sort(),['Q0001','Q0002','Q0003']);
});
test('random retains an eligible anchor, and never adds an ineligible anchor',()=>{
 assert.equal(orderedIds(cards.slice(0,3),'random',999,'Q0002')[0],'Q0002');
 assert.ok(!orderedIds(cards.slice(0,2),'random',999,'Q0099').includes('Q0099'));
});
test('malformed URL values get safe defaults and tags are deduplicated',()=>{
 const f=readFilters(new URLSearchParams('tag=rag&tag=rag&match=no&mode=evil&seed=NaN'));
 assert.deepEqual(f.tags,['rag']); assert.equal(f.match,'any'); assert.equal(f.mode,'sequential'); assert.equal(f.seed,1);
});
