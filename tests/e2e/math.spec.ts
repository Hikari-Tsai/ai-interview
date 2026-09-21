import {test,expect} from '@playwright/test';

test('math typography keeps a subscript smaller and attached to its base on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:960});
 await page.goto('/zh-TW/questions/Q0320/?ready=1');
 await page.locator('#answer-button:not([disabled])').click();
 await page.evaluate(()=>document.fonts.ready);
 const dimensions=await page.locator('.katex').evaluateAll(elements=>{
  const math=elements.find(el=>el.querySelector('annotation')?.textContent==='p_{I}')!;
  const glyphs=[...math.querySelectorAll('.katex-html .mathnormal')];
  const base=glyphs.find(el=>el.textContent==='p')!,sub=glyphs.find(el=>el.textContent==='I')!;
  return {baseFont:parseFloat(getComputedStyle(base).fontSize),subFont:parseFloat(getComputedStyle(sub).fontSize),baseTop:base.getBoundingClientRect().top,subTop:sub.getBoundingClientRect().top};
 });
 expect(dimensions.subFont).toBeLessThan(dimensions.baseFont);
 expect(Math.abs(dimensions.subTop-dimensions.baseTop)).toBeLessThan(dimensions.baseFont);
});
