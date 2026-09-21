import {PARSER_VERSION} from './pipeline.ts';
export interface UpstreamState {commit:string;blob:string;parserVersion?:string;observedCommit?:string}
type GithubMetadata=(endpoint:string)=>Promise<any>;
export async function inspectUpstream(state:UpstreamState|undefined,hasQuestions:boolean,reparse:boolean,github:GithubMetadata){
 const ref=await github('git/ref/heads/main');
 const commit=ref.object?.sha;
 if(typeof commit!=='string'||!/^[0-9a-f]{40}$/.test(commit))throw new Error('Invalid upstream commit');
 const parserMatches=state?.parserVersion===PARSER_VERSION&&!reparse&&hasQuestions;
 // The Git ref is tiny; normal unchanged runs avoid commit/tree/README payloads.
 if(parserMatches&&(state?.observedCommit??state?.commit)===commit)return {commit,blob:state!.blob,unchanged:true};
 // Git database endpoints return metadata, unlike REST commits/{ref}, which embeds file patches.
 const metadata=await github(`git/commits/${commit}`);
 const treeSha=metadata.tree?.sha;
 if(typeof treeSha!=='string'||!/^[0-9a-f]{40}$/.test(treeSha))throw new Error('Invalid upstream tree');
 const tree=await github(`git/trees/${treeSha}`);
 const file=tree.tree?.find((entry:any)=>entry.path==='README.md'&&entry.type==='blob');
 if(typeof file?.sha!=='string'||!/^[0-9a-f]{40}$/.test(file.sha))throw new Error('Pinned commit is missing README.md');
 return {commit,blob:file.sha as string,unchanged:!!parserMatches&&state?.blob===file.sha};
}
