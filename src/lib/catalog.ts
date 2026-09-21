import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Answer, Card, Question, SourceRecord } from './types';
import {answerInputHash,answerContentHash} from '../../scripts/lib/answers';
const read = (path:string) => JSON.parse(readFileSync(path,'utf8'));
export function loadCards(): Card[] {
 const directory=resolve('data/questions');
 if(!existsSync(directory)) return [];
 const sourcesDir=resolve('data/sources');
 const sources:SourceRecord[]=existsSync(sourcesDir)?readdirSync(sourcesDir).filter(n=>n.endsWith('.json')).map(n=>read(resolve(sourcesDir,n))):[];
 return readdirSync(directory).filter(n=>/^Q\d+\.json$/.test(n)).map(name=>{
   const q=read(resolve(directory,name)) as Question;
   const path=resolve('data/answers',name);
   let answer: Answer|undefined=existsSync(path)?read(path):undefined;
   const overridePath=resolve('data/overrides',name);
   if(existsSync(overridePath)) {
    const override=read(overridePath) as {pin:boolean;answer:Answer};
    if(override.pin) {
     answer=override.answer;
     const dependencies=sources.filter(s=>q.links.some(l=>l.url===s.url)&&s.contentHash).map(s=>({url:s.url,contentHash:s.contentHash}));
     const expected=answer.model==='codex-source-reviewed'?answerContentHash(q):answerInputHash(q,dependencies,answer.model,answer.promptVersion);
     if(answer.inputHash!==expected)answer={...answer,status:'stale'};
    }
   }
   if(answer?.model==='codex-source-reviewed' && answer.inputHash!==answerContentHash(q)) answer={...answer,status:'stale'};
   return {...q, answer};
 }).sort((a,b)=>a.number-b.number);
}
export function publicIndex(cards:Card[]) {
 return cards.map(c=>({id:c.id,number:c.number,original:c.original,topic:c.topic,tags:c.tags,companies:c.companies,active:c.active,
 answer:c.answer?{status:c.answer.status,locales:Object.fromEntries(Object.entries(c.answer.locales).map(([l,a])=>[l,{title:a?.title}]))}:undefined}));
}
export function dataUpdatedAt(cards:Card[]):string|undefined {
 const statePath=resolve('data/state/upstream.json');
 const syncedAt=existsSync(statePath)?read(statePath).syncedAt:undefined;
 const timestamps=[syncedAt,...cards.map(c=>c.answer?.generatedAt)]
  .filter((value):value is string=>typeof value==='string')
  .map(value=>Date.parse(value)).filter(Number.isFinite);
 return timestamps.length?new Date(Math.max(...timestamps)).toISOString():undefined;
}
