import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findNewlyStale} from '../scripts/lib/freshness';
import {answerInputHash} from '../scripts/lib/answers';
import type {Answer,Question,SourceRecord} from '../src/lib/types';

const sourceUrl='https://outcomeschool.com/blog/llm-evaluation';
const question=(id:string):Question=>({id,number:Number(id.slice(1)),original:`Question ${id}`,topic:'Evaluation',group:'Tests',companies:[],tags:['evaluation'],originalAnswer:'',links:[{title:'Evaluation',url:sourceUrl}],source:{repo:'https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise',commit:'a'.repeat(40),path:'README.md',lineStart:1,lineEnd:1,url:`https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/${'a'.repeat(40)}/README.md#L1-L1`},contentHash:'b'.repeat(64),active:true});
const answer=(q:Question,hash:string,status:'ready'|'stale'='ready'):Answer=>({questionId:q.id,inputHash:answerInputHash(q,[{url:sourceUrl,contentHash:hash}],'gpt-6-astra'),status,generatedAt:'2026-10-06T00:00:00.000Z',model:'gpt-6-astra',promptVersion:'grounded-longform-v2',sourceUrls:[q.source.url,sourceUrl],locales:{}});
const source=(contentHash:string):SourceRecord=>({url:sourceUrl,title:'Evaluation',status:'ok',checkedAt:'2026-10-06T00:00:00.000Z',contentHash});

test('later shared-article refresh marks earlier ready answer stale while preserving current answers',()=>{
 const early=question('Q0035'),later=question('Q0073');
 const oldHash='1'.repeat(64),newHash='2'.repeat(64);
 const original=[answer(early,oldHash),answer(later,newHash)];
 assert.deepEqual(findNewlyStale([early,later],original,[source(oldHash)],new Set()),['Q0073']);
 assert.deepEqual(findNewlyStale([early,later],original,[source(newHash)],new Set()),['Q0035']);
 assert.deepEqual(findNewlyStale([early,later],[{...original[0],status:'stale'},original[1]],[source(newHash)],new Set()),[]);
 assert.deepEqual(findNewlyStale([early,later],original,[source(newHash)],new Set(['Q0035'])),[]);
});
