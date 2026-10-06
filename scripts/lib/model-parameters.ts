export function modelParameters(model:string,maxTokens:number){
 // GPT-6 reasoning models use a shared completion budget and reject sampling controls.
 if(/^gpt-6(?:\.1)?-(?:astra|sol|luna)(?:-|$)/.test(model))
  return {max_completion_tokens:maxTokens,reasoning_effort:'low' as const};
 return {max_tokens:maxTokens,temperature:0.2};
}
