import { readDirectory,readJson,writeJson,limitFromEnv } from './lib/io.ts';
import { loadText,fetchArticle,sourcePath } from './lib/sources.ts';
import { answerInputHash,answerContentHash,validateAnswer,shouldGenerate,buildPrompt,PROMPT_VERSION,boundSources } from './lib/answers.ts';
import {hash} from './lib/pipeline.ts';
import type { Answer, Question, SourceRecord } from '../src/lib/types.ts';
type Job={status:'ready'|'pending'|'failed';attempts:number;inputHash?:string;sourceHash?:string;nextRetryAt?:string;error?:string;updatedAt:string};
async function main(){
 const key=process.env.LLM_API_KEY||process.env.OPENAI_API_KEY;
 const model=process.env.LLM_MODEL;
 const force=process.argv.includes('--force');
 const selected=new Set((process.env.GENERATION_IDS??'').split(',').filter(Boolean));
 const state=await readJson<Record<string,Job>>('data/state/generation.json',{});
 const maxTokens=limitFromEnv('LLM_MAX_TOKENS',16000,24000);
 const sourceCharacters=limitFromEnv('LLM_SOURCE_CHAR_LIMIT',30000,120000);
 if(maxTokens<100||sourceCharacters<1000)throw new Error('LLM budgets must be at least 100 output tokens and 1000 source characters');
 const cap=limitFromEnv('GENERATION_LIMIT',10,1000);const fetchCap=limitFromEnv('GENERATION_SOURCE_FETCH_LIMIT',10,200);
 let generated=0,attempted=0,fetched=0;
 for(const q of (await readDirectory<Question>('data/questions')).filter(q=>q.active&&(!selected.size||selected.has(q.id)))) {
  const answerFile=`data/answers/${q.id}.json`;
  const old=await readJson<Answer|undefined>(answerFile,undefined);
  const override=await readJson<{pin:boolean;answer:Answer}|undefined>(`data/overrides/${q.id}.json`,undefined);
  const records=(await Promise.all(q.links.map(l=>readJson<SourceRecord|undefined>(sourcePath(l.url),undefined)))).filter((r):r is SourceRecord=>!!r);
  const grounded=records.filter(r=>r.contentHash);
  if(override?.pin){
   const checked=validateAnswer(override.answer,q,q.links.map(l=>l.url),true);
   const expected=checked.model==='codex-source-reviewed'?answerContentHash(q):answerInputHash(q,grounded.map(r=>({url:r.url,contentHash:r.contentHash})),checked.model,checked.promptVersion);
   await writeJson(answerFile,checked.inputHash===expected?checked:{...checked,status:'stale'});
   continue;
  }
  let dependencyHash=hash(grounded.map(r=>({url:r.url,contentHash:r.contentHash})).sort((a,b)=>a.url.localeCompare(b.url)));
  const previous=state[q.id];
  if(old?.status==='ready'&&old.model==='codex-source-reviewed'&&old.promptVersion===PROMPT_VERSION&&old.inputHash===answerContentHash(q)&&!force&&(!previous?.sourceHash||previous.sourceHash===dependencyHash)) {
   validateAnswer(old,q,q.links.map(l=>l.url),true);
   state[q.id]={status:'ready',attempts:0,inputHash:old.inputHash,sourceHash:dependencyHash,updatedAt:previous?.updatedAt??new Date().toISOString()};continue;
  }
  let inputHash=answerInputHash(q,grounded.map(r=>({url:r.url,contentHash:r.contentHash})),model??old?.model??'unconfigured');
  if(!force&&!shouldGenerate(old,inputHash)){try{validateAnswer(old,q,grounded.map(r=>r.url),true);continue;}catch{/* invalid old output is retried */}}
  // Preserve last good content while accurately labeling its freshness.
  if(old&&old.status!=='stale')await writeJson(answerFile,{...old,status:'stale'});
  if(!grounded.length){state[q.id]={...previous,status:'pending',attempts:previous?.attempts??0,inputHash,error:'No supported extracted source material is available yet.',updatedAt:previous?.status==='pending'?previous.updatedAt:new Date().toISOString()};continue;}
  if(!key||!model){state[q.id]={...previous,status:'pending',attempts:previous?.attempts??0,inputHash,error:'Configure LLM_API_KEY (or OPENAI_API_KEY) and LLM_MODEL.',updatedAt:previous?.status==='pending'?previous.updatedAt:new Date().toISOString()};continue;}
  if(attempted>=cap||(!force&&previous?.nextRetryAt&&Date.parse(previous.nextRetryAt)>Date.now()))continue;
  try {
   const sources:{url:string;text:string}[]=[];
   for(let record of grounded){
    let text=await loadText(record);
    if(!text&&fetched<fetchCap){record=await fetchArticle(record.url,record);fetched++;await writeJson(sourcePath(record.url),record);text=await loadText(record);}
    if(!text)throw new Error('Article snapshot unavailable within fetch limit; retry next run.');
    sources.push({url:record.url,text});
   }
   // Never fabricate a source-backed answer from an inaccessible link label.
   if(!sources.length)throw new Error('No extracted article text available; waiting for supported source material.');
   const actualRecords=await Promise.all(sources.map(s=>readJson<SourceRecord>(sourcePath(s.url),null as any)));
   inputHash=answerInputHash(q,actualRecords.map(r=>({url:r.url,contentHash:r.contentHash})),model);
   dependencyHash=hash(actualRecords.map(r=>({url:r.url,contentHash:r.contentHash})).sort((a,b)=>a.url.localeCompare(b.url)));
   attempted++;
   const endpoint=new URL(process.env.LLM_BASE_URL||'https://api.openai.com/v1');
   if(endpoint.protocol!=='https:'&&!(endpoint.protocol==='http:'&&['localhost','127.0.0.1'].includes(endpoint.hostname)))throw new Error('LLM_BASE_URL must use HTTPS (except local providers)');
   endpoint.pathname=endpoint.pathname.replace(/\/$/,'')+'/chat/completions';
   // Astra's completion budget includes reasoning; sampling controls are unsupported.
   const parameters=/^gpt-6-astra(?:-|$)/.test(model)
    ?{max_completion_tokens:maxTokens,reasoning_effort:'low'}
    :{max_tokens:maxTokens,temperature:0.2};
   const lengthFeedback=previous?.error?.startsWith('Long-form length')
    ?`\nA previous attempt failed the length check: ${previous.error} Regenerate from the supplied original sources. Aim for the middle of each language's requested range. Add missing explanations, assumptions and concrete examples when short; remove repetition when long. Do not merely pad the text.`:'';
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:'system',content:'You write careful source-grounded interview study notes and valid JSON.'},{role:'user',content:buildPrompt(q,boundSources(sources,sourceCharacters))+lengthFeedback}],response_format:{type:'json_object'},...parameters}),signal:AbortSignal.timeout(300000)});
   if(!response.ok)throw new Error(`Model HTTP ${response.status}`);
   const result:any=await response.json();const choice=result.choices?.[0];
   if(choice?.message?.refusal)throw new Error('Model refused to generate this answer.');
   if(choice?.finish_reason==='length')throw new Error('Model output reached the token limit; review LLM_MAX_TOKENS before retrying.');
   if(choice?.finish_reason!=='stop')throw new Error('Model did not finish normally; no answer saved.');
   if(typeof choice.message?.content!=='string'||!choice.message.content.trim())throw new Error('Model returned no answer text.');
   let payload:unknown;
   try{payload=JSON.parse(choice.message.content);}catch{throw new Error('Model returned invalid JSON; no answer saved.');}
   if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Model returned an invalid answer object.');
   // Original-question provenance is deterministic; article citations remain model-selected and validated.
   const cited=(payload as {sourceUrls?:unknown}).sourceUrls;
   const sourceUrls=Array.isArray(cited)?[...new Set([...cited,q.source.url,q.source.repo])]:cited;
   const answer=validateAnswer({...payload,sourceUrls,questionId:q.id,inputHash,status:'ready',generatedAt:new Date().toISOString(),model,promptVersion:PROMPT_VERSION},q,sources.map(s=>s.url));
   await writeJson(answerFile,answer);
   state[q.id]={status:'ready',attempts:(previous?.attempts??0)+1,inputHash,sourceHash:dependencyHash,updatedAt:new Date().toISOString()};generated++;
   console.log(`${q.id}: generated ${PROMPT_VERSION} (${generated}/${cap})`);
  } catch(e:any) {
   const attempts=(previous?.attempts??0)+1;
   state[q.id]={...previous,status:'failed',attempts,inputHash,error:String(e.message).slice(0,500),updatedAt:new Date().toISOString(),nextRetryAt:new Date(Date.now()+Math.min(86400000,3600000*2**Math.min(attempts-1,5))).toISOString()};
   console.error(`${q.id}: ${state[q.id].error}`);
  }
  await writeJson('data/state/generation.json',state);
 }
 await writeJson('data/state/generation.json',state);
 console.log(`Generated ${generated}; attempted ${attempted}; ${Object.values(state).filter(j=>j.status!=='ready').length} pending/failed jobs. ${key&&model?'Provider configured.':'No model requests made: credentials/model missing.'}`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
