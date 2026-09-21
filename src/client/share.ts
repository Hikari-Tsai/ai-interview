// Independent of catalog loading so a question can always be shared.
export function setupShare(){
 const button=document.querySelector<HTMLButtonElement>('#share-button');
 const status=document.querySelector<HTMLElement>('#share-status');
 if(!button||!status)return;
 button.disabled=false;
 button.addEventListener('click',async()=>{
  const url=button.dataset.url!,title=button.dataset.title!;
  status.textContent='';button.disabled=true;
  try{
   if(typeof navigator.share==='function'){
    try{await navigator.share({title,url});return;}
    catch(error){if(error instanceof DOMException&&error.name==='AbortError')return;}
   }
   try{
    await navigator.clipboard.writeText(url);
    status.textContent=button.dataset.copied!;
   }catch{
    window.prompt(button.dataset.copyPrompt,url);
   }
  }finally{button.disabled=false;}
 });
}
