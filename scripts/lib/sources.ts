import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import type { SourceRecord, Question } from '../../src/lib/types.ts';
import {hash} from './pipeline.ts';
import {readJson,writeJson,limitFromEnv} from './io.ts';
export function safeSourceUrl(input:string):boolean {
 try {const u=new URL(input);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&((u.hostname==='outcomeschool.com'&&u.pathname.startsWith('/blog/'))||(u.hostname==='outcomeschool.substack.com'&&u.pathname.startsWith('/p/')));}catch{return false;}
}
export function sourceDue(record:SourceRecord|undefined,now=new Date()):boolean {
 if(!record)return true;
 if(record.status==='unsupported')return false;
 return now.getTime()-Date.parse(record.checkedAt)>=(record.status==='failed'?6*3600000:7*86400000);
}
export const sourcePath=(url:string)=>`data/sources/${hash(url)}.json`;
export const privatePath=(url:string)=>`.private/sources/${hash(url)}.json`;
export async function loadText(record:SourceRecord):Promise<string|undefined> {
 const snapshot=await readJson<{contentHash:string;text:string}|undefined>(privatePath(record.url),undefined);
 return snapshot && snapshot.contentHash===record.contentHash?snapshot.text:undefined;
}
export async function fetchArticle(url:string,previous?:SourceRecord):Promise<SourceRecord> {
 const checkedAt=new Date().toISOString();
 if(!safeSourceUrl(url))return {url,title:previous?.title??url,status:'unsupported',checkedAt,error:'Only public Outcome School blog and Substack articles are supported.'};
 try {
  const hasSnapshot=previous?!!await loadText(previous):false;
  const headers:Record<string,string>={'User-Agent':'RecallInterviewCards/1.0','Accept':'text/html'};
  if(hasSnapshot&&previous?.etag)headers['If-None-Match']=previous.etag;
  if(hasSnapshot&&previous?.lastModified)headers['If-Modified-Since']=previous.lastModified;
  let current=url,response:Response|undefined;
  for(let redirects=0;redirects<=3;redirects++) {
   if(!safeSourceUrl(current))throw new Error('Redirect destination is outside source allowlist');
   response=await fetch(current,{headers,redirect:'manual',signal:AbortSignal.timeout(20000)});
   if(response.status>=300&&response.status<400&&response.status!==304){const location=response.headers.get('location');if(!location)throw new Error('Redirect without location');current=new URL(location,current).href;continue;}
   break;
  }
  if(response?.status===304&&previous)return {...previous,status:'ok',checkedAt,error:undefined};
  if(!response?.ok)throw new Error(`HTTP ${response?.status}`);
  if(!response.headers.get('content-type')?.includes('text/html'))throw new Error('Expected HTML');
  if(Number(response.headers.get('content-length')??0)>3_000_000)throw new Error('Article exceeds byte limit');
  const reader=response.body!.getReader();let bytes=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>3_000_000){await reader.cancel();throw new Error('Article exceeds byte limit');}chunks.push(value);}
  const html=Buffer.concat(chunks).toString('utf8');
  const {document}=parseHTML(html);
  const parsed=new Readability(document as unknown as Document).parse();
  const text=parsed?.textContent?.normalize('NFKC').replace(/\s+/g,' ').trim();
  if(!text||text.length<200)throw new Error('Article extraction was empty or too short');
  const contentHash=hash(text);
  await writeJson(privatePath(url),{url,contentHash,text});
  return {url,title:parsed?.title??previous?.title??url,status:'ok',contentHash,checkedAt,etag:response.headers.get('etag')??undefined,lastModified:response.headers.get('last-modified')??undefined};
 }catch(e:any){return {...previous,url,title:previous?.title??url,status:'failed',checkedAt,error:String(e.message).slice(0,240)};}
}
export async function refreshSources(questions:Question[],force=false):Promise<void> {
 const urls=[...new Set(questions.filter(q=>q.active).flatMap(q=>q.links.map(l=>l.url)))];
 const cap=limitFromEnv('SOURCE_FETCH_LIMIT',20,200);let fetched=0,unsupported=0;
 for(const url of urls) {
  const previous=await readJson<SourceRecord|undefined>(sourcePath(url),undefined);
  if(!safeSourceUrl(url)){if(!previous){await writeJson(sourcePath(url),await fetchArticle(url));unsupported++;}continue;}
  if((force||sourceDue(previous))&&fetched<cap){const record=await fetchArticle(url,previous);await writeJson(sourcePath(url),record);fetched++;console.log(`Source ${record.status}: ${url}`);}
 }
 console.log(`Sources: ${fetched} fetched, ${unsupported} unsupported recorded; public metadata only.`);
}
