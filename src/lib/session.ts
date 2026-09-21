import type { Card } from './types';
export interface Filters { tags: string[]; match: 'any'|'all'; company: string; search: string; ready: boolean; mode:'sequential'|'random'; seed:number; anchor:string }
export function readFilters(params: URLSearchParams): Filters {
 const seed = Number(params.get('seed') ?? 1);
 return { tags:[...new Set(params.getAll('tag').filter(Boolean))], match:params.get('match')==='all'?'all':'any', company:params.get('company')||'', search:params.get('search')||'', ready:params.get('ready')==='1', mode:params.get('mode')==='random'?'random':'sequential', seed:Number.isSafeInteger(seed)?seed:1, anchor:params.get('anchor')||'' };
}
export function filterCards(cards: Card[], filters: Filters): Card[] {
 const query=filters.search.trim().toLocaleLowerCase();
 return cards.filter(card=>card.active && (!filters.company||card.companies.includes(filters.company)) && (!filters.ready||card.answer?.status==='ready') &&
 (!filters.tags.length || (filters.match==='all' ? filters.tags.every(t=>card.tags.includes(t)) : filters.tags.some(t=>card.tags.includes(t)))) &&
 (!query || [card.id,card.original,card.topic,...card.tags,...Object.values(card.answer?.locales||{}).map(a=>a?.title||'')].join(' ').toLocaleLowerCase().includes(query)));
}
export function orderedIds(cards: Card[], mode: Filters['mode'], seed:number, anchor=''): string[] {
 const ids=[...cards].sort((a,b)=>a.number-b.number).map(c=>c.id);
 if(mode==='sequential') return ids;
 let value=seed>>>0;
 const random=()=>{value+=0x6D2B79F5;let x=value;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};
 for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
 if(ids.includes(anchor)) return [anchor,...ids.filter(id=>id!==anchor)];
 return ids;
}
