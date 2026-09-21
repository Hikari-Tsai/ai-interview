import {test} from 'node:test';
import assert from 'node:assert/strict';
import {companyName,companyStyle} from '../src/lib/companies';
import {filterCards,readFilters} from '../src/lib/session';
import type {Card} from '../src/lib/types';
test('company aliases share one label, color and filter including old URLs',()=>{
 assert.equal(companyName('Meta (Superintelligence Labs, FAIR, Llama)'),'Meta');
 assert.equal(companyStyle('Amazon (AWS)'),companyStyle('Amazon'));
 const cards=[{active:true,companies:['Meta'],tags:[]},{active:true,companies:['Meta (Superintelligence Labs, FAIR, Llama)'],tags:[]}] as unknown as Card[];
 for(const name of ['Meta','Meta (Superintelligence Labs, FAIR, Llama)'])assert.equal(filterCards(cards,readFilters(new URLSearchParams({company:name}))).length,2);
 assert.equal(companyName('New Company'),'New Company');
});
