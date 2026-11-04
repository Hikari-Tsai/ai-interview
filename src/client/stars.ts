export async function loadStars(locale:string){
 const button=document.querySelector<HTMLAnchorElement>('#star-btn');
 const badge=document.querySelector<HTMLElement>('#star-count');
 if(!button||!badge)return;
 const repo=new URL(button.href);
 if(repo.hostname!=='github.com'||!/^\/[\w.-]+\/[\w.-]+\/?$/.test(repo.pathname))return;
 try{
  const response=await fetch(`https://api.github.com/repos${repo.pathname.replace(/\/$/,'')}`,{
   headers:{Accept:'application/vnd.github+json'},
  });
  if(!response.ok)return;
  const count=(await response.json()).stargazers_count;
  if(!Number.isSafeInteger(count)||count<0)return;
  const formatted=new Intl.NumberFormat(locale).format(count);
  badge.textContent=formatted;
  badge.hidden=count===0;
  button.setAttribute('aria-label',button.dataset.starAria?.replace('{n}',formatted)??`${button.textContent?.trim()} ${formatted}`);
 }catch{/* Offline or rate limited: the ordinary repository link remains usable. */}
}
