import type {Card,Locale} from './types';
import {communityStarter} from './community';
export function contributionLinks(card:Card,locale:Locale,repository:string,pageUrl:string){
 const link=(path:string,params:Record<string,string>={})=>{const url=new URL(`${repository}/${path}`);url.search=new URLSearchParams(params).toString();return url.href;};
 const title=`[${card.id}] ${card.original.slice(0,140)}`;
 const filename=`content/community/${card.id}/${locale}.md`;
 return {
  discuss:link('discussions',{discussions_q:`${card.id} in:title`}),
  newDiscussion:link('discussions/new',{category:'q-a',title,question_id:card.id,question_url:pageUrl,body:`Question: ${card.id}\n${card.original}\n\nPage: ${pageUrl}\nOriginal source: ${card.source.url}\n\nWhat would you like to discuss?\n`}),
  suggest:link('issues/new',{template:'answer-contribution.yml',title,question_id:card.id,question_url:pageUrl,original_source:card.source.url,language:locale}),
  edit:card.community?.[locale]?link(`edit/main/${filename}`):link('new/main',{filename,value:communityStarter(card,locale,card.communityHash!)}),
  history:link(`commits/main/${filename}`),guide:link('blob/main/CONTRIBUTING.md')
 };
}
