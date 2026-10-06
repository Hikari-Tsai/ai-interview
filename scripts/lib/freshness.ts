import type {Answer,Question,SourceRecord} from '../../src/lib/types.ts';
import {answerContentHash,answerInputHash} from './answers.ts';

// Article snapshots can be refetched while generating a later question. Compare
// every ready answer against the final public source hashes before validation.
export function findNewlyStale(questions:Question[],answers:Answer[],sources:SourceRecord[],pinnedIds:Set<string>):string[]{
 const byQuestion=new Map(questions.map(question=>[question.id,question]));
 return answers.flatMap(answer=>{
  if(answer.status!=='ready'||pinnedIds.has(answer.questionId))return [];
  const question=byQuestion.get(answer.questionId);
  if(!question)return []; // The validator reports orphan answers separately.
  const linkUrls=new Set(question.links.map(link=>link.url));
  const dependencies=sources.filter(source=>linkUrls.has(source.url)&&source.contentHash).map(source=>({url:source.url,contentHash:source.contentHash}));
  const expected=answer.model==='codex-source-reviewed'
   ?answerContentHash(question)
   :answerInputHash(question,dependencies,answer.model,answer.promptVersion);
  return answer.inputHash===expected?[]:[answer.questionId];
 });
}
