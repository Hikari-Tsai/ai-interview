import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {stringify} from 'yaml';
import {parseHTML} from 'linkedom';
import {loadCards} from '../src/lib/catalog.ts';
import {filterCards,readFilters} from '../src/lib/session.ts';
import {answerInputHash} from '../scripts/lib/answers.ts';
const original=JSON.parse(readFileSync('data/questions/Q0001.json','utf8'));
const ai=JSON.parse(readFileSync('data/answers/Q0001.json','utf8'));
function fixture(locale='en'){
 const root=process.cwd(),temp=mkdtempSync(join(tmpdir(),'recall-community-'));
 for(const path of ['data/questions','data/answers','content/community/Q0001'])mkdirSync(join(temp,path),{recursive:true});
 writeFileSync(join(temp,'data/questions/Q0001.json'),JSON.stringify(original));
 const front={questionId:'Q0001',locale,title:'Community explanation',intent:'Explain assumptions and verify the result.',hint:['Start from variance.'],authors:['contributor'],updatedAt:'2026-09-21T06:00:00Z',reviewedAgainst:answerInputHash(original,[],'community','community-v1'),sourceUrls:[original.source.repo,original.source.url,'https://example.org/reference']};
 const markdown=`---\n${stringify(front)}---\n\n## Principle\nAn independently reviewed explanation.\n\n## Trade-off\nCompare accuracy and cost.\n\n## Implementation\nTest the implementation.\n\n## Production\nMonitor the failure modes.\n\n## Advanced\nA deeper derivation.\n`;
 writeFileSync(join(temp,`content/community/Q0001/${locale}.md`),markdown);
 process.chdir(temp);return {temp,markdown,restore(){process.chdir(root);rmSync(temp,{recursive:true,force:true});}};
}
test('community answer wins in its language, survives AI regeneration and preserves other locales',()=>{
 const f=fixture();try{
  writeFileSync('data/answers/Q0001.json',JSON.stringify(ai));
  let card=loadCards()[0];assert.equal(card.answer?.locales.en?.title,'Community explanation');assert.equal(card.answer?.locales.ja?.title,ai.locales.ja.title);assert.equal(card.community?.en?.needsReview,false);assert.equal(card.aiGeneratedAt,ai.generatedAt);
  const regenerated=structuredClone(ai);regenerated.locales.en.title='Regenerated AI answer';writeFileSync('data/answers/Q0001.json',JSON.stringify(regenerated));
  assert.equal(loadCards()[0].answer?.locales.en?.title,'Community explanation');assert.equal(readFileSync('content/community/Q0001/en.md','utf8'),f.markdown);
  const changed={...original,original:'Updated source question'};writeFileSync('data/questions/Q0001.json',JSON.stringify(changed));card=loadCards()[0];assert.equal(card.answer?.locales.en?.title,'Community explanation');assert.equal(card.community?.en?.needsReview,true);
 }finally{f.restore();}
});
test('a community-only answer fills a pending question only for the contributed language',()=>{
 const f=fixture('zh-TW');try{const cards=loadCards();const filters=readFilters(new URLSearchParams('ready=1'));assert.equal(cards[0].answer?.status,'ready');assert.equal(filterCards(cards,filters,'zh-TW').length,1);assert.equal(filterCards(cards,filters,'en').length,0);}finally{f.restore();}
});
test('invalid community sources or missing required sections fail closed',()=>{
 const f=fixture();try{
  writeFileSync('content/community/Q0001/en.md',f.markdown.replace('https://example.org/reference','javascript:alert(1)'));assert.throws(()=>loadCards(),/sourceUrls|https|HTTPS/i);
  writeFileSync('content/community/Q0001/en.md',f.markdown.replace('## Production','## Operations'));assert.throws(()=>loadCards(),/Production|section/i);
 }finally{f.restore();}
});

test('community Markdown drops executable HTML and unsafe links while preserving code',async()=>{
 const {renderCommunityMarkdown}=await import('../src/lib/community.ts');
 const html=renderCommunityMarkdown('<script>alert(1)</script>\n\n[bad](javascript:alert)\n\n```js\nconst x = "<script>";\n```');
 assert(!html.includes('<script>'));assert(!html.includes('href="javascript:'));assert(html.includes('<pre><code'));assert.equal(parseHTML(html).document.querySelector('code')?.textContent,'const x = "<script>";\n');
});
