import { promises as fs } from 'node:fs';
import path from 'node:path';
export async function readJson<T>(file: string, fallback: T): Promise<T> { try {return JSON.parse(await fs.readFile(file,'utf8'));} catch(e:any) {if(e.code==='ENOENT')return fallback;throw e;} }
export async function writeJson(file: string,value: unknown) {
 const text=JSON.stringify(value,null,2)+'\n';
 try {if(await fs.readFile(file,'utf8')===text)return false;}catch(e:any){if(e.code!=='ENOENT')throw e;}
 await fs.mkdir(path.dirname(file),{recursive:true});
 const temporary=`${file}.${process.pid}.tmp`;await fs.writeFile(temporary,text);await fs.rename(temporary,file);return true;
}
export async function readDirectory<T>(directory:string):Promise<T[]> {
 let files:string[];try{files=await fs.readdir(directory);}catch(e:any){if(e.code==='ENOENT')return [];throw e;}
 return Promise.all(files.filter(f=>f.endsWith('.json')).sort().map(f=>readJson<T>(path.join(directory,f),null as T)));
}
export function limitFromEnv(name:string,fallback:number,max:number) {const n=Number(process.env[name]??fallback);if(!Number.isInteger(n)||n<0||n>max)throw new Error(`${name} must be an integer from 0 to ${max}`);return n;}
