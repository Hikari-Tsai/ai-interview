import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadCards} from '../src/lib/catalog.ts';
import {answerContentHash} from '../scripts/lib/answers.ts';
test('pinned editorial answer is rendered directly, but stale input is not represented as current',()=>{
 const root=process.cwd();const q=JSON.parse(readFileSync('data/questions/Q0001.json','utf8'));const a=JSON.parse(readFileSync('data/answers/Q0001.json','utf8'));
 a.model='codex-source-reviewed';a.inputHash=answerContentHash(q);
 const temp=mkdtempSync(join(tmpdir(),'recall-catalog-'));
 try{
  for(const dir of ['questions','answers','overrides'])mkdirSync(join(temp,'data',dir),{recursive:true});
  writeFileSync(join(temp,'data/questions/Q0001.json'),JSON.stringify(q));
  a.locales.en.title='Editorial correction';
  writeFileSync(join(temp,'data/overrides/Q0001.json'),JSON.stringify({pin:true,answer:a}));
  process.chdir(temp);assert.equal(loadCards()[0].answer?.locales.en?.title,'Editorial correction');assert.equal(loadCards()[0].answer?.status,'ready');
  a.inputHash='0'.repeat(64);writeFileSync(join(temp,'data/overrides/Q0001.json'),JSON.stringify({pin:true,answer:a}));
  assert.equal(loadCards()[0].answer?.status,'stale');
 }finally{process.chdir(root);rmSync(temp,{recursive:true,force:true});}
});
