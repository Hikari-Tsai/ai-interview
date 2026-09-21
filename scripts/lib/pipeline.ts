import { createHash } from 'node:crypto';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { toString } from 'mdast-util-to-string';
import type { Question, Link } from '../../src/lib/types.ts';
export const PARSER_VERSION='readme-ast-v2';
export const REPO = 'https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise';
export const hash = (value: unknown) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export const normalize = (s: string) => s.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
export const TOPIC_TAGS: Record<string,string> = {'LLM Internals and Architecture':'llm','Inference, Serving and GPU Performance':'inference','RAG and Retrieval':'rag','Agents and Tool Use':'agents','Fine-Tuning, Post-Training and Alignment':'finetuning','Evaluation and Observability':'evaluation','Safety, Security and Responsible AI':'safety','Multimodal, Speech and Voice AI':'multimodal','AI System Design':'system-design','Coding and Data Structures':'coding','Applied and Forward-Deployed Scenarios':'applied','Behavioral and Culture':'behavioral','ML and DL Fundamentals':'ml'};
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function inferTags(topic:string,original:string):string[]{
 const tags=[TOPIC_TAGS[topic]??'other'];
 const rules:[string,RegExp][]=[['inference',/\bKV[- ]cache\b/i],['rag',/\bRAG\b/i],['evaluation',/\bevaluat(?:e|es|ion|ions|ing)\b/i],['production',/\b(?:production|deploy(?:ment|ed|ing|s)?|latency|throughput|reliability)\b/i],['agents',/\b(?:agents?|tool[- ](?:calls?|use)|function[- ]calling)\b/i]];
 for(const [tag,pattern] of rules)if(pattern.test(original)&&!tags.includes(tag)&&tags.length<4)tags.push(tag);
 return tags;
}
type Context = Question['source'];
export type ParsedQuestion = Omit<Question,'id'|'number'|'active'>;
function allLinks(node: any): Link[] {
 const result: Link[]=[];
 if(node.type==='link' && /^https:\/\//.test(node.url)) result.push({title:toString(node),url:node.url});
 for(const child of node.children??[]) result.push(...allLinks(child));
 return result;
}
export function parseReadme(markdown: string, context: Pick<Context,'repo'|'commit'|'path'>): ParsedQuestion[] {
 const tree=unified().use(remarkParse).parse(markdown);
 const questions: ParsedQuestion[]=[];
 let group='', company='', topic='', common=false;
 for(const node of tree.children) {
  if(node.type==='heading') {
   const title=toString(node);
   if(node.depth===2) {group=title;company='';topic='';common=/^Common Questions Asked Across Companies$/i.test(title);}
   if(node.depth===3) { if(common) topic=title; else {company=title;topic='';} }
   if(node.depth===4 && !common && company) topic=title;
   continue;
  }
  if(node.type!=='list'||!topic||!group) continue;
  for(const item of node.children) {
   const first=item.children.find(n=>n.type==='paragraph');
   if(!first) continue;
   const original=toString(first).trim();
   if(!original||/^(Answer|Asked at):/i.test(original)) continue;
   const nested=item.children.filter(n=>n.type==='list').flatMap(n=>n.children);
   const answerItems=nested.filter(n=>/^Answer:/i.test(toString(n)));
   const asked=nested.filter(n=>/^Asked at:/i.test(toString(n)));
   const companies=common ? asked.flatMap(n=>toString(n).replace(/^Asked at:\s*/i,'').split(',').map(s=>s.trim()).filter(Boolean)) : [company];
   const originalAnswer=answerItems.map(n=>markdown.slice(n.position!.start.offset,n.position!.end.offset).replace(/^Answer:\s*/i,'')).join('\n');
   const links=answerItems.flatMap(allLinks).filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);
   const lineStart=item.position!.start.line,lineEnd=item.position!.end.line;
   const source={...context,lineStart,lineEnd,url:`${context.repo}/blob/${context.commit}/${context.path}#L${lineStart}-L${lineEnd}`};
   const content={original,topic,group,companies,tags:inferTags(topic,original),originalAnswer,links};
   questions.push({...content,source,contentHash:hash(content)});
  }
 }
 return questions;
}
export function reconcile(previous: Question[], incoming: ParsedQuestion[], allowRemovals=false): Question[] {
 const active=previous.filter(q=>q.active);
 if(!incoming.length || (!allowRemovals && active.length>=10 && incoming.length<active.length*0.75)) throw new Error('Question removal guard: empty input or more than 25% removed; inspect upstream and use --allow-removals deliberately.');
 let next=Math.max(0,...previous.map(q=>q.number))+1;
 const used=new Set<string>();
 const incomingCount=new Map<string,number>();
 for(const q of incoming) incomingCount.set(normalize(q.original),(incomingCount.get(normalize(q.original))??0)+1);
 const result=incoming.map(q=>{
  const candidates=active.filter(old=>!used.has(old.id)&&normalize(old.original)===normalize(q.original));
  const contextual=candidates.filter(old=>old.group===q.group&&old.topic===q.topic&&JSON.stringify(old.companies)===JSON.stringify(q.companies));
  const match=contextual.length===1?contextual[0]:(candidates.length===1&&incomingCount.get(normalize(q.original))===1?candidates[0]:undefined);
  const number=match?.number??next++;
  const id=match?.id??`Q${String(number).padStart(4,'0')}`;
  used.add(id); return {...q,id,number,active:true};
 });
 if(!allowRemovals && active.length>=10 && active.filter(q=>!used.has(q.id)).length>active.length*0.25) throw new Error('Question removal guard: more than 25% of existing questions would retire. Inspect changes before --allow-removals.');
 // Tombstones reserve every previously allocated number indefinitely.
 return [...result,...previous.filter(q=>!used.has(q.id)).map(q=>({...q,active:false}))];
}
