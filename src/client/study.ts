import {filterCards,orderedIds,readFilters} from '../lib/session';
import {historyFor,recordVisit,type VisitHistory} from '../lib/history';
import type {Card,Locale} from '../lib/types';
type Meta={locale:Locale;id:string;base:string;labels:Record<string,string>};
const meta=JSON.parse(document.getElementById('study-meta')!.textContent!) as Meta;
const $=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const all=<T extends HTMLElement=HTMLElement>(selector:string)=>Array.from(document.querySelectorAll<T>(selector));
const base=meta.base.replace(/\/$/,'');
const questionUrl=(id:string,params:URLSearchParams,locale:string=meta.locale)=>`${base}/${locale}/questions/${id}/${params.size?'?'+params.toString():''}`;
try{localStorage.setItem('recall-locale',meta.locale);}catch{}
// Disclosure controls remain usable even when the catalog cannot be fetched.
for(const [buttonId,panelId,closed,open] of [['hint-button','hint-panel','hint','hideHint'],['answer-button','answer-panel','reveal','hideAnswer']]){
 const button=$<HTMLButtonElement>('#'+buttonId),panel=$('#'+panelId);
 button.disabled=false;
 button.addEventListener('click',()=>{const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));panel.hidden=expanded;button.querySelector('span')!.textContent=meta.labels[expanded?closed:open];});
}
$('#mobile-filter').addEventListener('click',()=>{const button=$('#mobile-filter');const open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));$('#filter-panel').classList.toggle('is-open',!open);if(!open)$('#filter-panel').scrollIntoView({block:'start',behavior:'smooth'});});
$('#filter-close').addEventListener('click',()=>{$('#filter-panel').classList.remove('is-open');$('#mobile-filter').setAttribute('aria-expanded','false');$('#mobile-filter').focus();});
all<HTMLAnchorElement>('[data-locale]').forEach(a=>{a.href=questionUrl(meta.id,new URLSearchParams(location.search),a.dataset.locale!);});
async function setup(){
 const response=await fetch(`${base}/catalog.json`);
 if(!response.ok)throw new Error(`Cannot load question catalog (${response.status})`);
 const cards=await response.json() as Card[];
 let params=new URLSearchParams(location.search);
 let deck:string[]=[];
 let visits:VisitHistory|undefined;
 try{const saved=JSON.parse(sessionStorage.getItem('recall-visits')||'null');if(saved&&Array.isArray(saved.ids)&&saved.ids.every((id:unknown)=>typeof id==='string')&&Number.isInteger(saved.cursor))visits=saved;}catch{}
 const persistVisits=()=>{try{sessionStorage.setItem('recall-visits',JSON.stringify(visits));}catch{}};
 const visit=(id:string,direction:'previous'|'next')=>{if(visits){visits=recordVisit(visits,id,direction);persistVisits();}};
 const freshSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
 function render(allowNavigation=true){
  const filters=readFilters(params);
  const filtered=filterCards(cards,filters,meta.locale);
  deck=orderedIds(filtered,filters.mode,filters.seed,filters.anchor);
  const current=deck.indexOf(meta.id);
  const historyKey=JSON.stringify({locale:meta.locale,tags:[...filters.tags].sort(),match:filters.match,company:filters.company,search:filters.search,ready:filters.ready});
  visits=historyFor(visits,historyKey,meta.id);persistVisits();
  // An unfiltered retired permalink remains readable, but does not re-enter active decks.
  const retired=cards.find(c=>c.id===meta.id)?.active===false && !params.size;
  if(deck.length&&current===-1&&allowNavigation&&!retired){location.replace(questionUrl(deck[0],params));return;}
  $('#card-area').hidden=!deck.length&&!retired;$('#empty-state').hidden=!!deck.length||retired;
  $('#result-count').textContent=String(deck.length);$('#deck-count').textContent=String(deck.length);
  $<HTMLInputElement>('#search').value=filters.search;$<HTMLSelectElement>('#company').value=filters.company;$<HTMLInputElement>('#ready').checked=filters.ready;
  all<HTMLInputElement>('input[name=tag]').forEach(c=>c.checked=filters.tags.includes(c.value));
  all<HTMLButtonElement>('[data-match]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.match===filters.match)));
  all<HTMLButtonElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===filters.mode)));
  const position=Math.max(0,current+1);
  $('#position').textContent=meta.labels.position.replace('{current}',String(position)).replace('{total}',String(deck.length));
  $('#progress-fill').style.width=`${deck.length?position/deck.length*100:0}%`;
  const prev=$<HTMLAnchorElement>('#previous'),next=$<HTMLAnchorElement>('#next');
  const previousId=visits.ids[visits.cursor-1];
  const forwardId=visits.ids[visits.cursor+1];
  prev.setAttribute('aria-disabled',String(!previousId));prev.tabIndex=previousId?0:-1;
  prev.href=previousId?questionUrl(previousId,params):'#';prev.dataset.target=previousId||'';
  const last=current===deck.length-1,canShuffle=!forwardId&&last&&filters.mode==='random'&&deck.length>1;
  const nextDisabled=deck.length<=1||(!forwardId&&last&&!canShuffle);
  next.setAttribute('aria-disabled',String(nextDisabled));next.tabIndex=nextDisabled?-1:0;
  const nextId=forwardId||(current>=0&&!last?deck[current+1]:'');
  next.href=nextId?questionUrl(nextId,params):'#';next.dataset.target=nextId;next.dataset.reshuffle=String(canShuffle);
  next.querySelector('span')!.textContent=meta.labels[canShuffle?'reshuffle':'next'];
  $('#round-complete').hidden=!last||deck.length<2;
  const chips=$('#active-tags');chips.replaceChildren();
  for(const tag of filters.tags){const chip=document.createElement('button');chip.type='button';const input=all<HTMLInputElement>('input[name=tag]').find(i=>i.value===tag);chip.textContent=`${input?.parentElement?.querySelector('.custom-check + span')?.textContent||tag} ×`;chip.addEventListener('click',()=>{const kept=filters.tags.filter(t=>t!==tag);params.delete('tag');kept.forEach(t=>params.append('tag',t));apply(true);});chips.append(chip);}
  chips.hidden=!filters.tags.length;
  all<HTMLAnchorElement>('[data-locale]').forEach(a=>a.href=questionUrl(meta.id,params,a.dataset.locale!));
 }
 function apply(resetRandom=false){
  if(resetRandom&&readFilters(params).mode==='random'){params.set('seed',String(freshSeed()));params.set('anchor',meta.id);}
  history.pushState({},'',questionUrl(meta.id,params));render();
 }
 $('#filter-form').addEventListener('submit',event=>{event.preventDefault();const value=$<HTMLInputElement>('#search').value.trim();value?params.set('search',value):params.delete('search');apply(true);});
 $('#filter-form').addEventListener('change',event=>{
  const el=event.target as HTMLInputElement;
  if(el.name==='tag'){params.delete('tag');all<HTMLInputElement>('input[name=tag]:checked').forEach(c=>params.append('tag',c.value));}
  else if(el.name==='company'){el.value?params.set('company',el.value):params.delete('company');}
  else if(el.name==='ready'){el.checked?params.set('ready','1'):params.delete('ready');}
  else return;
  apply(true);
 });
 all<HTMLButtonElement>('[data-match]').forEach(button=>button.addEventListener('click',()=>{params.set('match',button.dataset.match!);apply(true);}));
 all<HTMLButtonElement>('[data-mode]').forEach(button=>button.addEventListener('click',()=>{if(readFilters(params).mode===button.dataset.mode)return;if(visits){visits={...visits,ids:visits.ids.slice(0,visits.cursor+1)};persistVisits();}params.set('mode',button.dataset.mode!);if(button.dataset.mode==='random'){params.set('seed',String(freshSeed()));params.set('anchor',meta.id);}else{params.delete('seed');params.delete('anchor');}apply();}));
 all<HTMLButtonElement>('[data-add-tag]').forEach(button=>button.addEventListener('click',()=>{if(!params.getAll('tag').includes(button.dataset.addTag!))params.append('tag',button.dataset.addTag!);apply(true);}));
 all<HTMLButtonElement>('[data-reset]').forEach(button=>button.addEventListener('click',()=>{const mode=readFilters(params).mode;params=new URLSearchParams();if(mode==='random')params.set('mode','random');apply(true);}));
 $('#next').addEventListener('click',event=>{const next=$<HTMLAnchorElement>('#next');if(next.getAttribute('aria-disabled')==='true'){event.preventDefault();return;}if(next.dataset.reshuffle==='true'){event.preventDefault();params.set('seed',String(freshSeed()));params.delete('anchor');const f=readFilters(params);let shuffled=orderedIds(filterCards(cards,f),'random',f.seed);if(shuffled[0]===meta.id&&shuffled.length>1){params.set('anchor',shuffled[1]);shuffled=orderedIds(filterCards(cards,f),'random',f.seed,shuffled[1]);}visits=undefined;try{sessionStorage.removeItem('recall-visits');}catch{}location.assign(questionUrl(shuffled[0],params));}else if(next.dataset.target){visit(next.dataset.target,'next');}});
 $('#previous').addEventListener('click',event=>{const prev=$('#previous');if(prev.getAttribute('aria-disabled')==='true')event.preventDefault();else if(prev.dataset.target)visit(prev.dataset.target,'previous');});
 addEventListener('popstate',()=>{params=new URLSearchParams(location.search);render();});
 document.addEventListener('keydown',event=>{const target=event.target as HTMLElement;if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||target.closest('input,select,textarea,button,summary,[contenteditable]'))return;const button=event.key==='ArrowLeft'?$('#previous'):event.key==='ArrowRight'?$('#next'):undefined;if(button&&button.getAttribute('aria-disabled')!=='true'){event.preventDefault();button.click();}});
 render();
 all<HTMLButtonElement>('[data-hydrate]').forEach(button=>button.disabled=false);
 $<HTMLButtonElement>('#mobile-filter').disabled=false;
 $('#filter-panel').removeAttribute('inert');
 document.body.dataset.ready='true';
}
setup().catch(error=>console.error(error));
