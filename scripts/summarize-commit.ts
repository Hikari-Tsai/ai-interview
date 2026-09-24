import {writeFileSync} from 'node:fs';
import {collectChanges,commitMessage} from './lib/commit-summary';
const destination=process.argv[2];
if(!destination)throw new Error('Provide the commit message output path.');
const message=await commitMessage(collectChanges(),{
 key:process.env.LLM_API_KEY||process.env.OPENAI_API_KEY,
 model:process.env.LLM_MODEL,
 baseUrl:process.env.LLM_BASE_URL
});
writeFileSync(destination,message,{mode:0o600});
