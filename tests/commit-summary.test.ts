import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {collectChanges,commitMessage} from '../scripts/lib/commit-summary';

test('summary reads the staged snapshot, excludes private files and skips state-only LLM calls',async()=>{
 const cwd=mkdtempSync(join(tmpdir(),'commit-summary-'));
 const git=(...args:string[])=>execFileSync('git',args,{cwd,stdio:'pipe'});
 try{
  git('init');git('config','user.name','Test');git('config','user.email','test@example.test');
  mkdirSync(join(cwd,'data/questions'),{recursive:true});mkdirSync(join(cwd,'data/state'),{recursive:true});
  const file=join(cwd,'data/questions/Q0001.json');
  writeFileSync(file,JSON.stringify({original:'Old title',tags:['llm']}));git('add','.');git('commit','-m','initial');
  writeFileSync(file,JSON.stringify({original:'Staged title',tags:['llm']}));git('add','.');
  writeFileSync(file,JSON.stringify({original:'Unstaged title',tags:['llm']}));
  writeFileSync(join(cwd,'secret.txt'),'PRIVATE SENTINEL');git('add','secret.txt');
  const changes=collectChanges(cwd);
  assert.equal(changes.contentChanged,true);assert.match(JSON.stringify(changes),/Staged title/);assert.doesNotMatch(JSON.stringify(changes),/Unstaged title|PRIVATE SENTINEL/);
  for(let i=2;i<90;i++)writeFileSync(join(cwd,`data/questions/Q${String(i).padStart(4,'0')}.json`),JSON.stringify({original:'New question '.repeat(100)}));
  git('add','data/questions');const bounded=collectChanges(cwd);
  assert.ok(bounded.omitted>0);assert.ok(bounded.details.reduce((total,item)=>total+JSON.stringify(item).length,0)<=12000);
  assert.equal(bounded.counts.questions,89);
  git('reset','--hard','HEAD');writeFileSync(join(cwd,'data/state/sync.json'),'{}');git('add','.');
  const state=collectChanges(cwd);assert.equal(state.contentChanged,false);
  const message=await commitMessage(state,{key:'test',model:'gpt-6-astra',request:async()=>{throw Error('must not call');}});
  assert.match(message,/metadata/);
 }finally{rmSync(cwd,{recursive:true,force:true});}
});

test('model message uses bounded input and Astra parameters; failures fall back',async()=>{
 const changes={counts:{questions:1,answers:0,sources:0,state:0},contentChanged:true,details:[{path:'data/questions/Q0001.json',status:'M',changes:{original:{before:'Old',after:'New'}}}],omitted:0};
 let calls=0;
 const message=await commitMessage(changes,{key:'test',model:'gpt-6-astra',request:async(_url,init)=>{
  calls++;const body=JSON.parse(String(init?.body));assert.equal(body.reasoning_effort,'low');assert.ok(body.max_completion_tokens);assert.equal(body.temperature,undefined);
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({subject:'chore: clarify Q0001 wording',body:'- Clarify the question wording.'})}}]}));
 }});
 assert.equal(calls,1);assert.match(message,/clarify Q0001/);
 for(const request of [async()=>new Response('Failure',{status:500}),async()=>new Response(JSON.stringify({choices:[{finish_reason:'length'}]})),async()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'not JSON'}}]}))]){
  assert.match(await commitMessage(changes,{key:'test',model:'gpt-6-astra',request}),/^chore: update validated interview data/);
 }
});
