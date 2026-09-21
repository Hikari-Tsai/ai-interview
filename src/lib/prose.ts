import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, {defaultSchema} from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import type {Root, Nodes, Paragraph} from 'mdast';
import type {VFile} from 'vfile';

// Generated answers are plain text. Only opt-in math is interpreted; underscores,
// angle brackets, code snippets, and Markdown-looking text retain their spelling.
function preservePlainText(){
 return (tree:Root,file:VFile)=>{
  const math:Extract<Nodes,{type:'math'|'inlineMath'}>[]=[];
  function collect(node:Nodes){
   if(node.type==='math'||node.type==='inlineMath')math.push(node);
   else if('children' in node)node.children.forEach(collect);
  }
  collect(tree);
  const source=String(file.data.originalProse??file),children:Root['children']=[];
  let paragraph:Paragraph={type:'paragraph',children:[]},offset=0;
  function flush(){if(paragraph.children.length)children.push(paragraph);paragraph={type:'paragraph',children:[]};}
  function append(text:string){
   text.split('\n').forEach((line,i)=>{
    if(i)flush();
    if(line)paragraph.children.push({type:'text',value:line});
   });
  }
  for(const node of math){
   append(source.slice(offset,node.position!.start.offset!));
   if(node.type==='math'){flush();children.push(node);}
   else paragraph.children.push(node);
   offset=node.position!.end.offset!;
  }
  append(source.slice(offset));flush();tree.children=children;
 };
}

// Conservative legacy notation support; code identifiers and ordinary numbers
// stay literal. New or more complex formulas can use explicit $...$ delimiters.
function titleNotation(){
 return (tree:Root)=>{
  for(const paragraph of tree.children){
   if(paragraph.type!=='paragraph')continue;
   paragraph.children=paragraph.children.flatMap(node=>{
    if(node.type!=='text')return [node];
    const parts:Paragraph['children']=[];
    const pattern=/\b1\/sqrt\(d_k\)|\bO\(1\)|\bn\s*>\s*1\b|<\s*100\s*ms\b/g;
    let offset=0;
    for(const match of node.value.matchAll(pattern)){
     parts.push({type:'text',value:node.value.slice(offset,match.index)});
     const value=match[0].startsWith('1/')?'\\frac{1}{\\sqrt{d_k}}'
      :match[0].startsWith('O')?'O(1)':match[0].startsWith('n')?'n > 1':'<100\\,\\mathrm{ms}';
     parts.push({type:'inlineMath',value,data:{hName:'code',hProperties:{className:['language-math','math-inline']},hChildren:[{type:'text',value}]}});offset=match.index!+match[0].length;
    }
    parts.push({type:'text',value:node.value.slice(offset)});
    return parts;
   });
  }
 };
}

function processor(plain:boolean,title=false){
 const pipeline=unified().use(remarkParse).use(remarkMath);
 if(plain)pipeline.use(preservePlainText);
 if(title)pipeline.use(titleNotation);
 return pipeline.use(remarkRehype).use(rehypeSanitize,{
  ...defaultSchema,
  attributes:{...defaultSchema.attributes,code:[['className',/^language-./,'math-inline','math-display']]}
 }).use(rehypeKatex,{trust:false,strict:'error',maxExpand:1000,maxSize:20}).use(rehypeStringify);
}
const plain=processor(true),markdown=processor(false),title=processor(true,true);
function render(value:string,community:boolean,heading=false){
 // Mask unambiguous currency starts without shifting source offsets. Restore the
 // original text through preservePlainText; no existing JSON needs migration.
 const input=community?value:value.replace(/(?<=\b[A-Z]{2})\$(?=\d)|\$(?=\d[\d,.]*(?:\s+[A-Za-z]{2,}\b|[、，。]))/g,'\uE000');
 const file=(heading?title:community?markdown:plain).processSync({value:input,data:{originalProse:value}});
 if(file.messages.length){
  const issue=file.messages[0];
  throw new Error(`Invalid answer formula: ${issue.cause instanceof Error?issue.cause.message:issue.reason}`);
 }
 return String(file);
}
export function renderAnswerText(value:string){return render(value,false);}
export function renderCommunityMarkdown(value:string){return render(value,true);}

export function renderQuestionTitle(value:string){
 return render(value,false,true).replace(/<\/?p>/g,'');
}
