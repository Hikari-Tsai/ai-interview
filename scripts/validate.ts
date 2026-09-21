import { z } from 'zod';
import {readDirectory,readJson} from './lib/io.ts';
import {validateAnswer,answerInputHash,answerContentHash} from './lib/answers.ts';
import {hash,REPO} from './lib/pipeline.ts';
import type {Question,Answer,SourceRecord} from '../src/lib/types.ts';
const digest=z.string().regex(/^[a-f0-9]{64}$/);
const https=z.string().url().refine(u=>u.startsWith('https://'));
const questionSchema=z.object({id:z.string().regex(/^Q\d{4,}$/),number:z.number().int().positive(),original:z.string().min(1),topic:z.string().min(1),group:z.string().min(1),companies:z.array(z.string()),tags:z.array(z.string()).min(1),originalAnswer:z.string(),links:z.array(z.object({title:z.string(),url:https}).strict()),source:z.object({repo:z.literal(REPO),commit:z.string().regex(/^[a-f0-9]{40}$/),path:z.literal('README.md'),lineStart:z.number().int().positive(),lineEnd:z.number().int().positive(),url:https}).strict(),contentHash:digest,active:z.boolean()}).strict();
const sourceSchema=z.object({url:https,title:z.string(),status:z.enum(['ok','failed','unsupported']),contentHash:digest.optional(),checkedAt:z.string().datetime(),etag:z.string().optional(),lastModified:z.string().optional(),error:z.string().optional()}).strict();
function paths(value:unknown,prefix=''):string[]{if(!value||typeof value!=='object'||Array.isArray(value))return [prefix];return Object.entries(value).flatMap(([key,v])=>paths(v,`${prefix}.${key}`)).sort();}
async function main(){
 const questions=await readDirectory<Question>('data/questions');
 if(!questions.some(q=>q.active))throw new Error('Question dataset is missing. Run npm run sync before validating/building.');
 const ids=new Set<string>(),numbers=new Set<number>();
 const dictionaries=await Promise.all(['zh-TW','en','ja'].map(locale=>readJson<Record<string,any>>(`lang/${locale}.json`,{})));
 const keys=JSON.stringify(paths(dictionaries[0]));
 if(!keys||keys==='[""]'||dictionaries.some(d=>JSON.stringify(paths(d))!==keys))throw new Error('Locale dictionaries must have identical nonempty keys');
 for(const q of questions){
  questionSchema.parse(q);
  if(ids.has(q.id)||numbers.has(q.number)||q.id!==`Q${String(q.number).padStart(4,'0')}`)throw new Error(`Duplicate or inconsistent question ID: ${q.id}`);
  ids.add(q.id);numbers.add(q.number);
  if(q.source.lineEnd<q.source.lineStart||q.source.url!==`${q.source.repo}/blob/${q.source.commit}/${q.source.path}#L${q.source.lineStart}-L${q.source.lineEnd}`)throw new Error(`Invalid source permalink: ${q.id}`);
  const {original,topic,group,companies,tags,originalAnswer,links}=q;
  if(q.contentHash!==hash({original,topic,group,companies,tags,originalAnswer,links}))throw new Error(`Invalid question content hash: ${q.id}`);
  for(const tag of q.tags)if(!dictionaries.every(d=>typeof d.tagLabels?.[tag]==='string'))throw new Error(`Untranslated tag: ${tag}`);
 }
 const sources=await readDirectory<SourceRecord>('data/sources');
 for(const s of sources)sourceSchema.parse(s); // strict schema rejects full prose or HTML in public records
 const overrides=await readDirectory<{pin:boolean;answer:Answer}>('data/overrides');
 const pinnedIds=new Set(overrides.filter(o=>o.pin).map(o=>o.answer.questionId));
 const answers=await readDirectory<Answer>('data/answers');
 for(const a of answers){const q=questions.find(q=>q.id===a.questionId);if(!q)throw new Error(`Orphan answer: ${a.questionId}`);validateAnswer(a,q,q.links.map(l=>l.url),true);
  if(!pinnedIds.has(q.id)&&a.status==='ready'&&a.model==='codex-source-reviewed'&&a.inputHash!==answerContentHash(q))throw new Error(`Seed answer requires freshness review: ${q.id}`);
  if(a.model!=='codex-source-reviewed'){
   const dependencies=sources.filter(s=>q.links.some(l=>l.url===s.url)&&s.contentHash).map(s=>({url:s.url,contentHash:s.contentHash}));
   for(const url of a.sourceUrls.filter(u=>!u.startsWith(q.source.repo)))if(!dependencies.some(s=>s.url===url))throw new Error(`Missing extracted source provenance: ${url}`);
   if(!pinnedIds.has(q.id)&&a.status==='ready'&&a.inputHash!==answerInputHash(q,dependencies,a.model,a.promptVersion))throw new Error(`Generated answer requires refresh: ${q.id}`);
  }
 }
 for(const o of overrides){z.object({pin:z.literal(true),answer:z.unknown()}).strict().parse(o);const q=questions.find(q=>q.id===o.answer.questionId);if(!q)throw new Error('Orphan override');validateAnswer(o.answer,q,q.links.map(l=>l.url),true);}
 console.log(`Validated ${questions.length} questions, ${answers.length} answers, ${sources.length} public source metadata records, and 3 locale dictionaries.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
