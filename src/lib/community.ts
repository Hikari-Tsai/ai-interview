import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {parse,stringify} from 'yaml';
import {z} from 'zod';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import {toString} from 'mdast-util-to-string';
import {answerInputHash} from '../../scripts/lib/answers';
import {locales,type Locale,type Question,type SourceRecord,type CommunityAnswer} from './types';

const frontmatter=z.object({
 questionId:z.string().regex(/^Q\d{4,}$/),locale:z.enum(locales),title:z.string().trim().min(1),
 intent:z.string().trim().min(1),hint:z.array(z.string().trim().min(1)).min(1).max(6),
 authors:z.array(z.string().regex(/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i)).min(1),
 updatedAt:z.string().datetime({offset:true}),reviewedAgainst:z.string().regex(/^[a-f0-9]{64}$/),
 sourceUrls:z.array(z.string().url().refine(u=>{const url=new URL(u);return url.protocol==='https:'&&!url.username&&!url.password;},'Sources must use HTTPS without credentials')).min(2)
}).strict();
const headings={Principle:'principle','Trade-off':'tradeoff',Implementation:'implementation',Production:'production',Advanced:'advanced'} as const;
export function communityHash(q:Question,sources:SourceRecord[]){
 return answerInputHash(q,sources.filter(s=>s.contentHash&&q.links.some(l=>l.url===s.url)).map(s=>({url:s.url,contentHash:s.contentHash})),'community','community-v1');
}
export function readCommunity(q:Question,sources:SourceRecord[]):Partial<Record<Locale,CommunityAnswer>>{
 const directory=join('content/community',q.id),result:Partial<Record<Locale,CommunityAnswer>>={};
 if(!existsSync(directory))return result;
 for(const filename of readdirSync(directory)){
  if(!filename.endsWith('.md'))continue;
  const locale=filename.slice(0,-3) as Locale;
  if(!locales.includes(locale))throw new Error(`Unsupported community locale: ${q.id}/${filename}`);
  const raw=readFileSync(join(directory,filename),'utf8');
  const match=raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if(!match)throw new Error(`Missing community frontmatter: ${q.id}/${filename}`);
  const meta=frontmatter.parse(parse(match[1],{maxAliasCount:0}));
  if(meta.questionId!==q.id||meta.locale!==locale)throw new Error(`Community file identity mismatch: ${q.id}/${filename}`);
  if(!meta.sourceUrls.includes(q.source.repo)||!meta.sourceUrls.some(u=>u.startsWith(`${q.source.repo}/blob/`)&&/\/blob\/[a-f0-9]{40}\/README\.md#L\d+(?:-L\d+)?$/.test(u)))throw new Error(`Community answer must credit the original repository and pinned question: ${q.id}`);
  const body=match[2],tree=unified().use(remarkParse).parse(body);
  const sections:Record<string,string>={};
  const titles=tree.children.filter(node=>node.type==='heading'&&node.depth===2);
  for(let i=0;i<titles.length;i++){
   const title=toString(titles[i]) as keyof typeof headings,key=headings[title];
   if(!key||key in sections)throw new Error(`Unknown or duplicate community section: ${title}`);
   sections[key]=body.slice(titles[i].position!.end.offset!,titles[i+1]?.position!.start.offset).trim();
  }
  for(const [title,key]of Object.entries(headings))if(key!=='advanced'&&!sections[key])throw new Error(`Missing community section: ${title}`);
  result[locale]={...meta,principle:sections.principle,tradeoff:sections.tradeoff,implementation:sections.implementation,production:sections.production,advanced:sections.advanced,supplementNote:'',needsReview:meta.reviewedAgainst!==communityHash(q,sources)};
 }
 return result;
}
export function validateCommunityPaths(questions:Question[]){
 if(!existsSync('content/community'))return;
 const ids=new Set(questions.map(q=>q.id));
 for(const entry of readdirSync('content/community',{withFileTypes:true})){
  if(entry.isDirectory()&&!ids.has(entry.name))throw new Error(`Unknown community question directory: ${entry.name}`);
 }
}
const markdown=unified().use(remarkParse).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify);
export function renderCommunityMarkdown(value:string){return String(markdown.processSync(value));}
export function communityStarter(q:Question,locale:Locale,reviewedAgainst:string){
 const meta={questionId:q.id,locale,title:q.original.slice(0,180),intent:'',hint:[''],authors:[],updatedAt:new Date().toISOString(),reviewedAgainst,sourceUrls:[q.source.repo,q.source.url]};
 return `---\n${stringify(meta)}---\n\n<!-- Complete the metadata above. Write in ${locale}. See CONTRIBUTING.md. -->\n\n## Principle\n\n## Trade-off\n\n## Implementation\n\n## Production\n\n## Advanced\n`;
}
