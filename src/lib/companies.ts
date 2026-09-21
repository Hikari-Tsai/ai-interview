// Presentation aliases only: preserve the upstream company names in source data.
const aliases:Record<string,string>={
 'Meta (Superintelligence Labs, FAIR, Llama)':'Meta',
 'Amazon (AWS)':'Amazon',
 'Google DeepMind and Google AI':'Google DeepMind',
 'Cursor (Anysphere)':'Cursor',
 'Zhipu AI (GLM)':'Zhipu AI',
 'Alibaba (Qwen)':'Alibaba',
 'Moonshot AI (Kimi)':'Moonshot AI',
 'Cognition (Devin, Windsurf)':'Cognition',
 'Consumer-Scale ML Companies (Uber, Netflix, LinkedIn, Airbnb, Pinterest, Spotify)':'Consumer-Scale ML Companies'
};
export function companyName(name:string){return aliases[name]||name;}
export function companyStyle(name:string){
 const hash=[...companyName(name)].reduce((hash,char)=>(Math.imul(hash,31)+char.charCodeAt(0))>>>0,0);
 const hue=hash%360;
 return `--company-bg:hsl(${hue} 55% 95%);--company-ink:hsl(${hue} 48% 28%);--company-border:hsl(${hue} 38% 78%)`;
}
