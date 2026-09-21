import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReadme, reconcile, hash } from '../scripts/lib/pipeline.ts';
import { safeSourceUrl, sourceDue, fetchArticle } from '../scripts/lib/sources.ts';
import { answerInputHash,answerContentHash, validateAnswer, shouldGenerate, boundSources } from '../scripts/lib/answers.ts';
const context = {repo:'https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise', commit:'a'.repeat(40), path:'README.md'};
const md = `## Common Questions Asked Across Companies
### LLM Internals and Architecture
- Explain attention.
  - Asked at: [OpenAI](#openai), [Meta](#meta)
  - Answer: [One](https://outcomeschool.com/blog/one) and [Two](https://outcomeschool.com/blog/two)
## Frontier AI Labs
### Anthropic
> Roles: engineer
#### Coding and Data Structures
- Build an in-memory database.
### License
- This is not a question.
`;
test('AST parser keeps imperatives, nested companies, all answer links and pinned lines', () => {
 const qs=parseReadme(md,context); assert.equal(qs.length,2);
 assert.deepEqual(qs[0].companies,['OpenAI','Meta']); assert.equal(qs[0].links.length,2);
 assert.equal(qs[0].original,'Explain attention.'); assert.match(qs[0].originalAnswer,/\[Two\]/);
 assert.equal(qs[1].topic,'Coding and Data Structures'); assert.deepEqual(qs[1].companies,['Anthropic']);
 assert.match(qs[0].source.url,/\/blob\/a{40}\/README.md#L3-L5$/);
});
test('reconciliation survives reorder and moves; edits and retirement never recycle IDs',()=>{
 const original=reconcile([],parseReadme(md,context));
 const reordered=reconcile(original,[{...original[1],topic:'New topic'},original[0]]);
 assert.deepEqual(reordered.filter(q=>q.active).map(q=>q.id),['Q0002','Q0001']);
 const edited=reconcile(original,[{...original[0],original:'Explain sparse attention.'},original[1]]);
 assert.equal(edited[0].id,'Q0003'); assert.equal(edited.find(q=>q.id==='Q0001')?.active,false);
 const revived=reconcile(edited,[original[0],original[1]]); assert.equal(revived[0].id,'Q0004');
});
test('ambiguous duplicate moves are assigned fresh IDs; catastrophic removals abort',()=>{
 const originals=reconcile([],Array.from({length:20},(_,i)=>({...parseReadme(md,context)[0],original:`Question ${i}`})));
 assert.throws(()=>reconcile(originals,[originals[0]]),/removal guard/i);
 const same=parseReadme(md,context)[0];
 const duplicates=reconcile([], [{...same,topic:'A'},{...same,topic:'B'}]);
 const moved=reconcile(duplicates,[{...same,topic:'C'},{...same,topic:'D'}]);
 assert.deepEqual(moved.filter(q=>q.active).map(q=>q.id),['Q0003','Q0004']);
});
test('source policy rejects unsafe URLs and unsupported providers; failures retry before weekly successes',()=>{
 for(const url of ['http://outcomeschool.com/blog/a','https://outcomeschool.com.evil.test/blog/a','https://user@outcomeschool.com/blog/a','https://127.0.0.1/a','https://outcomeschool.com:8443/blog/a','https://youtube.com/watch?v=a','https://outcomeschool.com/blog/../admin']) assert.equal(safeSourceUrl(url),false,url);
 assert.equal(safeSourceUrl('https://outcomeschool.com/blog/kv-cache-in-llms'),true);
 assert.equal(safeSourceUrl('https://outcomeschool.substack.com/p/attention'),true);
 const record={url:'x',title:'x',status:'ok' as const,checkedAt:'2026-09-20T00:00:00Z'};
 assert.equal(sourceDue(record,new Date('2026-09-21')),false);
 assert.equal(sourceDue({...record,status:'failed'},new Date('2026-09-21')),true);
});
test('generation hash invalidates source, question, prompt and model changes; ready unchanged work skips',()=>{
 const q=reconcile([],parseReadme(md,context))[0]; const sources=[{url:q.links[0].url,contentHash:hash('a')}];
 const input=answerInputHash(q,sources,'m','p');
 assert.notEqual(input,answerInputHash(q,[{...sources[0],contentHash:hash('b')}],'m','p'));
 assert.notEqual(input,answerInputHash(q,sources,'new','p')); assert.notEqual(input,answerInputHash(q,sources,'m','new'));
 assert.equal(shouldGenerate({status:'ready',inputHash:input} as any,input),false);
 assert.equal(shouldGenerate({status:'stale',inputHash:input} as any,input),true); assert.equal(shouldGenerate(undefined,input),true);
});
test('answer contract requires three locales, four sections and grounded allowed references',()=>{
 const q=reconcile([],parseReadme(md,context))[0]; const text={title:'Title',intent:'Intent',hint:['Hint'],principle:'Principle',tradeoff:'Tradeoff',implementation:'Implementation',production:'Production',supplementNote:'Additional engineering context.'};
 const a={questionId:q.id,status:'ready',inputHash:q.contentHash,generatedAt:new Date().toISOString(),model:'m',promptVersion:'p',sourceUrls:[q.source.url,q.links[0].url],locales:{en:text,'zh-TW':text,ja:text}};
 assert.doesNotThrow(()=>validateAnswer(a,q,[q.links[0].url]));
 assert.throws(()=>validateAnswer({...a,sourceUrls:[q.source.url,'https://invented.test']},q,[q.links[0].url]),/source/i);
 assert.throws(()=>validateAnswer({...a,locales:{en:text}},q,[q.links[0].url]));
});
test('removal guard also catches wholesale replacement at unchanged total count',()=>{
 const item=parseReadme(md,context)[0];
 const old=reconcile([],Array.from({length:20},(_,i)=>({...item,original:`Question ${i}`})));
 const changed=Array.from({length:20},(_,i)=>({...item,original:`Replacement ${i}`}));
 assert.throws(()=>reconcile(old,changed),/removal guard/i);
 assert.equal(reconcile(old,changed,true).filter(q=>q.active).length,20);
});

test('source fetch refuses an off-allowlist redirect before following it',async()=>{
 const originalFetch=globalThis.fetch;const calls:string[]=[];
 globalThis.fetch=async(input)=>{calls.push(String(input));return new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}});};
 try {const record=await fetchArticle('https://outcomeschool.com/blog/test-security');assert.equal(record.status,'failed');assert.match(record.error??'',/allowlist/);assert.deepEqual(calls,['https://outcomeschool.com/blog/test-security']);assert.equal('text' in record,false);} finally {globalThis.fetch=originalFetch;}
});
test('generator persists a rejected output for retry, then saves valid grounded output and skips unchanged work',async()=>{
 const {mkdtemp,mkdir,writeFile,readFile,rm}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');const {join,resolve}=await import('node:path');
 const {createServer}=await import('node:http');const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');
 const dir=await mkdtemp(join(tmpdir(),'recall-pipeline-'));
 const q={...reconcile([],parseReadme(md,context))[0],id:'Q0002',number:2};let calls=0,valid=false;
 const text={title:'Title',intent:'Intent',hint:['Hint'],principle:'Principle',tradeoff:'Tradeoff',implementation:'Implementation',production:'Production',supplementNote:'Additional advice is distinguished from source explanation.'};
 const server=createServer((req,res)=>{let body='';req.on('data',c=>body+=c);req.on('end',()=>{calls++;const input=JSON.parse(body);assert.match(input.messages[1].content,/source-grounded|grounded/);res.setHeader('content-type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({sourceUrls:[q.source.url,q.source.repo,valid?q.links[0].url:'https://invented.test'],locales:{en:text,'zh-TW':text,ja:text}})}}]}));});});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const port=(server.address() as any).port;
 try {
  for(const d of ['data/questions','data/sources','.private/sources'])await mkdir(join(dir,d),{recursive:true});
  await writeFile(join(dir,'data/questions/Q0002.json'),JSON.stringify(q));
  const noSource={...q,id:'Q0001',number:1,links:[],originalAnswer:''};
  await writeFile(join(dir,'data/questions/Q0001.json'),JSON.stringify(noSource));
  const contentHash=hash('Grounded article text.');const url=q.links[0].url;
  await writeFile(join(dir,`data/sources/${hash(url)}.json`),JSON.stringify({url,title:'Article',status:'ok',checkedAt:new Date().toISOString(),contentHash}));
  await writeFile(join(dir,`.private/sources/${hash(url)}.json`),JSON.stringify({url,contentHash,text:'Grounded article text.'}));
  const run=(args:string[]=[],env:Record<string,string>={})=>promisify(execFile)(process.execPath,[resolve('node_modules/tsx/dist/cli.mjs'),resolve('scripts/generate.ts'),...args],{cwd:dir,env:{...process.env,GENERATION_LIMIT:'1',LLM_API_KEY:'test-local-key',LLM_MODEL:'test-local-model',LLM_BASE_URL:`http://127.0.0.1:${port}/v1`,...env}});
  await run();const failed=JSON.parse(await readFile(join(dir,'data/state/generation.json'),'utf8'));assert.equal(failed.Q0002.status,'failed');assert.match(failed.Q0002.error,/source/i);
  await assert.rejects(readFile(join(dir,'data/answers/Q0002.json')));
  valid=true;await run(['--force']);const saved=JSON.parse(await readFile(join(dir,'data/answers/Q0002.json'),'utf8'));assert.equal(saved.status,'ready');assert.equal(saved.locales.ja.title,'Title');
  await run();assert.equal(calls,2,'unchanged valid answers must not spend another model request');
  const baseline=JSON.parse(await readFile(join(dir,'data/state/generation.json'),'utf8')).Q0002.sourceHash;
  await writeFile(join(dir,'data/answers/Q0002.json'),JSON.stringify({...saved,model:'codex-source-reviewed',promptVersion:'seed-v1',inputHash:answerContentHash(q)}));
  const nextHash=hash('Changed article text.');
  await writeFile(join(dir,`data/sources/${hash(url)}.json`),JSON.stringify({url,title:'Article',status:'ok',checkedAt:new Date().toISOString(),contentHash:nextHash}));
  await writeFile(join(dir,`.private/sources/${hash(url)}.json`),JSON.stringify({url,contentHash:nextHash,text:'Changed article text.'}));
  for(let i=0;i<2;i++){
   await run([],{LLM_API_KEY:'',OPENAI_API_KEY:''});
   const job=JSON.parse(await readFile(join(dir,'data/state/generation.json'),'utf8')).Q0002;
   assert.equal(job.status,'pending');assert.equal(job.sourceHash,baseline,'missing credentials must preserve last successful source baseline');
   assert.equal(JSON.parse(await readFile(join(dir,'data/answers/Q0002.json'),'utf8')).status,'stale');
  }
  valid=false;await run();
  const retryFailure=JSON.parse(await readFile(join(dir,'data/state/generation.json'),'utf8')).Q0002;
  assert.equal(retryFailure.status,'failed');assert.equal(retryFailure.sourceHash,baseline,'provider failures must retain the last successful source baseline');
  valid=true;await run(['--force']);assert.equal(calls,4,'stale seed must retry once credentials return');
 }finally {server.close();await rm(dir,{recursive:true,force:true});}
});

test('article input budget is global across every source',()=>{
 const inputs=Array.from({length:5},(_,i)=>({url:`https://example.test/${i}`,text:'x'.repeat(20000)}));
 const result=boundSources(inputs,30000);assert.equal(result.length,5);assert.ok(result.every(s=>s.text.length>0));assert.ok(result.reduce((sum,s)=>sum+s.text.length,0)<=30000);
});
test('explicit question terms add bounded secondary tags while preserving primary topic',()=>{
 const question='Explain KV cache latency, RAG evaluation, and agent tool calls in production.';
 const parsed=parseReadme(`## Common Questions Asked Across Companies\n### LLM Internals and Architecture\n- ${question}\n`,context)[0];
 assert.deepEqual(parsed.tags,['llm','inference','rag','evaluation']);
 const kv=parseReadme('## Common Questions Asked Across Companies\n### LLM Internals and Architecture\n- What is KV cache and what are its memory implications?\n',context)[0];
 assert.deepEqual(kv.tags,['llm','inference']);
});
test('upstream inspection uses metadata-only endpoints and skips tree lookup on unchanged commit',async()=>{
 const {inspectUpstream}=await import('../scripts/lib/upstream.ts');
 const {PARSER_VERSION}=await import('../scripts/lib/pipeline.ts');
 const sha='a'.repeat(40),tree='b'.repeat(40),blob='c'.repeat(40);const calls:string[]=[];
 const api=async(endpoint:string)=>{calls.push(endpoint);if(endpoint==='git/ref/heads/main')return {object:{sha}};if(endpoint===`git/commits/${sha}`)return {tree:{sha:tree}};if(endpoint===`git/trees/${tree}`)return {tree:[{path:'README.md',type:'blob',sha:blob}]};throw new Error(`Unexpected endpoint ${endpoint}`);};
 const state={commit:sha,blob,parserVersion:PARSER_VERSION};
 assert.equal((await inspectUpstream(state,true,false,api)).unchanged,true);
 assert.deepEqual(calls,['git/ref/heads/main']);
 calls.length=0;assert.equal((await inspectUpstream(state,true,true,api)).unchanged,false);
 assert.deepEqual(calls,['git/ref/heads/main',`git/commits/${sha}`,`git/trees/${tree}`]);
 calls.length=0;assert.equal((await inspectUpstream({...state,parserVersion:'old'},true,false,api)).unchanged,false);
 assert.equal(calls.length,3);
 calls.length=0;assert.equal((await inspectUpstream({...state,commit:'d'.repeat(40),observedCommit:sha},true,false,api)).unchanged,true);
 assert.deepEqual(calls,['git/ref/heads/main']);
});
test('answer fingerprint ignores structural metadata but tracks question, README answer and links',()=>{
 const q=reconcile([],parseReadme(md,context))[0];const sources=[{url:q.links[0].url,contentHash:hash('source')}];
 const baseline=answerInputHash(q,sources,'model');
 assert.equal(answerInputHash({...q,companies:['Different company'],tags:['rag'],topic:'Moved topic',group:'Moved group',contentHash:hash('changed structural metadata')},sources,'model'),baseline);
 for(const changed of [{...q,original:q.original+' Explain why.'},{...q,originalAnswer:q.originalAnswer+' New explanation.'},{...q,links:[...q.links,{title:'New source',url:'https://outcomeschool.com/blog/new'}]}]) assert.notEqual(answerInputHash(changed,sources,'model'),baseline);
});
