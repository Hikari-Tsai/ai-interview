import {test,expect} from '@playwright/test';

test('share opens native sharing with the public question permalink',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'share',{value:async(data:ShareData)=>{(window as any).shared=data;}}));
 await page.goto('/zh-TW/questions/Q0001/?ready=1&tag=llm');
 await page.locator('#share-button:not([disabled])').click();
 const data=await page.evaluate(()=>(window as any).shared);
 expect(data.url).toBe('https://hikari-tsai.github.io/ai-interview/zh-TW/questions/Q0001/');
 expect(data.title).toContain('Q0001');
});

test('unsupported native sharing copies the link and reports success',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'share',{value:undefined});
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{(window as any).copied=text;}}});
 });
 await page.goto('/en/questions/Q0001/');
 await page.locator('#share-button:not([disabled])').click();
 await expect(page.locator('#share-status')).toHaveText('Link copied');
 expect(await page.evaluate(()=>(window as any).copied)).toBe('https://hikari-tsai.github.io/ai-interview/en/questions/Q0001/');
});

test('cancelling native sharing does not copy or report an error',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'share',{value:async()=>{throw new DOMException('Cancelled','AbortError');}}));
 await page.goto('/ja/questions/Q0001/');
 await page.locator('#share-button:not([disabled])').click();
 await expect(page.locator('#share-status')).toBeEmpty();
 await expect(page.locator('#share-button')).toBeEnabled();
});

test('clipboard denial offers a manually copyable link',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'share',{value:undefined});
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Denied');}}});
 });
 await page.goto('/en/questions/Q0001/');
 page.once('dialog',async dialog=>{
  expect(dialog.type()).toBe('prompt');
  expect(dialog.defaultValue()).toContain('/en/questions/Q0001/');
  await dialog.dismiss();
 });
 await page.locator('#share-button:not([disabled])').click();
 await expect(page.locator('#share-button')).toBeEnabled();
});
