import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {contributionLinks} from '../src/lib/contributions.ts';
const card=JSON.parse(readFileSync('data/questions/Q0001.json','utf8'));
const repo='https://github.com/Hikari-Tsai/ai-interview';
test('contribution URLs retain question identity, source and language without granting labels',()=>{
 const links=contributionLinks({...card,communityHash:'a'.repeat(64)},'ja',repo,'https://example.com/ai-interview/ja/questions/Q0001/');
 const issue=new URL(links.suggest);assert.equal(issue.searchParams.get('template'),'answer-contribution.yml');assert.equal(issue.searchParams.get('question_id'),'Q0001');assert.equal(issue.searchParams.get('language'),'ja');assert.equal(issue.searchParams.get('labels'),null);
 const edit=new URL(links.edit);assert.equal(edit.pathname,'/Hikari-Tsai/ai-interview/new/main');assert.equal(edit.searchParams.get('filename'),'content/community/Q0001/ja.md');assert(edit.searchParams.get('value')?.includes(card.source.url));assert(edit.href.length<8000);
 assert(new URL(links.discuss).searchParams.get('discussions_q')?.includes('Q0001'));assert(new URL(links.newDiscussion).searchParams.get('title')?.startsWith('[Q0001]'));
 const existing=contributionLinks({...card,community:{ja:{}}},'ja',repo,'https://example.com/');assert.equal(new URL(existing.edit).pathname,'/Hikari-Tsai/ai-interview/edit/main/content/community/Q0001/ja.md');
});
