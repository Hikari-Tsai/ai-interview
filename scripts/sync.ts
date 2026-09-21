import { parseReadme,reconcile,REPO,PARSER_VERSION } from './lib/pipeline.ts';
import { readDirectory,readJson,writeJson } from './lib/io.ts';
import { refreshSources } from './lib/sources.ts';
import {inspectUpstream,type UpstreamState} from './lib/upstream.ts';
import type {Question} from '../src/lib/types.ts';
const slug='pallavi-shekhar/ai-engineering-interview-questions-company-wise';
const headers:Record<string,string>={Accept:'application/vnd.github+json','User-Agent':'RecallInterviewCards/1.0'};
if(process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
async function github(endpoint:string){const r=await fetch(`https://api.github.com/repos/${slug}/${endpoint}`,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`GitHub API ${r.status} for ${endpoint}`);return r.json();}
async function main(){
 const state=await readJson<UpstreamState|undefined>('data/state/upstream.json',undefined);
 let questions=await readDirectory<Question>('data/questions');
 const {commit,blob,unchanged}=await inspectUpstream(state,questions.length>0,process.argv.includes('--reparse'),github);
 if(unchanged){
  console.log(`README unchanged (blob ${blob}); skipped download and reconciliation.`);
  // Remember an unrelated upstream commit without changing the question provenance.
  if(state&&(state.observedCommit??state.commit)!==commit)await writeJson('data/state/upstream.json',{...state,observedCommit:commit});
 }
 else {
  const response=await fetch(`https://raw.githubusercontent.com/${slug}/${commit}/README.md`,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`Pinned README HTTP ${response.status}`);
  const markdown=await response.text();
  const parsed=parseReadme(markdown,{repo:REPO,commit,path:'README.md'});
  questions=reconcile(questions,parsed,process.argv.includes('--allow-removals'));
  for(const q of questions)await writeJson(`data/questions/${q.id}.json`,q);
  await writeJson('data/state/upstream.json',{commit,blob,parserVersion:PARSER_VERSION,repo:REPO,path:'README.md',syncedAt:new Date().toISOString(),activeCount:questions.filter(q=>q.active).length});
  console.log(`Synced ${questions.filter(q=>q.active).length} active questions at ${commit}.`);
 }
 await refreshSources(questions,process.argv.includes('--refresh-sources'));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
