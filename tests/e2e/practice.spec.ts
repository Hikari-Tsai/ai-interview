import {test,expect} from '@playwright/test';
const start='/zh-TW/questions/Q0001/';
async function loaded(page:any){await expect(page.locator('#next')).not.toHaveAttribute('href','#');}
test('card hides answer, hint is independent, reveal has four source-linked sections',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(start);await loaded(page);
 await expect(page.locator('article[data-question]')).toHaveCount(1);
 await expect(page.locator('#answer-panel')).toBeHidden();await expect(page.locator('#hint-panel')).toBeHidden();
 await page.locator('#hint-button').click();await expect(page.locator('#hint-panel')).toBeVisible();await expect(page.locator('#answer-panel')).toBeHidden();
 await page.locator('#answer-button').click();await expect(page.locator('.answer-section')).toHaveCount(4);
 await expect(page.locator('#answer-panel a[href*="github.com/pallavi-shekhar/"]').first()).toBeVisible();
 await page.locator('#next').click();await expect(page).toHaveURL(/Q0002/);await expect(page.locator('#answer-panel')).toBeHidden();await expect(page.locator('#hint-panel')).toBeHidden();
 await loaded(page);await page.locator('#previous').click();await expect(page).toHaveURL(/Q0001/);expect(errors).toEqual([]);
});
test('three locales preserve current question and selected filters',async({page})=>{
 await page.goto(start+'?tag=llm&match=all');await loaded(page);
 await page.locator('[data-locale="ja"]').click();await expect(page).toHaveURL(/\/ja\/questions\/Q0001\/\?tag=llm&match=all/);
 await expect(page.locator('html')).toHaveAttribute('lang','ja');await expect(page.locator('#answer-button')).toContainText('答えを見る');
 await page.locator('[data-locale="en"]').click();await expect(page.locator('#answer-button')).toContainText('Reveal answer');
 await page.locator('#answer-button').click();await expect(page.locator('#production')).toBeVisible();
});
test('tag filtering bounds sequential deck and all-match may show empty state',async({page})=>{
 await page.goto(start);await loaded(page);
 await page.locator('input[name=tag][value=rag]').check();await expect(page).toHaveURL(/tag=rag/);
 await expect(page.locator('.question-tags')).toContainText('RAG');await loaded(page);
 const first=await page.locator('article').getAttribute('data-question');await page.locator('#next').click();await loaded(page);
 const second=await page.locator('article').getAttribute('data-question');expect(second!>first!).toBeTruthy();
 await page.locator('[data-match=all]').click();await page.locator('input[name=tag][value=behavioral]').check();
 await expect(page.locator('#empty-state')).toBeVisible();await expect(page.locator('#card-area')).toBeHidden();
 await page.locator('#empty-state [data-reset]').click();await expect(page.locator('#card-area')).toBeVisible();
});
test('random uses a reproducible non-repeating filtered deck and previous follows it',async({page})=>{
 await page.goto(start+'?ready=1&tag=llm');await loaded(page);
 const total=Number(await page.locator('#result-count').innerText());
 await page.locator('[data-mode=random]').click();await expect(page).toHaveURL(/mode=random/);
 await expect(page.locator('article')).toHaveAttribute('data-question','Q0001');
 const seen=['Q0001'];
 for(let i=0;i<3;i++){await page.locator('#next').click();await expect(page.locator('#next')).toHaveAttribute('data-reshuffle',i+2===total?'true':'false');seen.push((await page.locator('article').getAttribute('data-question'))!);}
 expect(new Set(seen).size).toBe(4);
 await page.locator('#previous').click();await expect(page.locator('article')).toHaveAttribute('data-question',seen[2]);
 await page.reload();await expect(page.locator('article')).toHaveAttribute('data-question',seen[2]);
});
test('search with no results and exactly one result disable navigation appropriately',async({page})=>{
 await page.goto(start+'?search=__no_such_question__');await expect(page.locator('#empty-state')).toBeVisible();
 await page.locator('#empty-state [data-reset]').click();await loaded(page);
 await page.locator('#search').fill('Q0001');await page.locator('#search').press('Enter');
 await expect(page.locator('#position')).toContainText('1／1');await expect(page.locator('#next')).toHaveAttribute('aria-disabled','true');await expect(page.locator('#previous')).toHaveAttribute('aria-disabled','true');
});
test('mobile stays within viewport and filter disclosure works',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(start);await loaded(page);
 await expect(page.locator('#filter-panel')).toBeHidden();await page.locator('#mobile-filter').click();await expect(page.locator('#filter-panel')).toBeVisible();
 await page.locator('#mobile-filter').click();await expect(page.locator('#filter-panel')).toBeHidden();
 await page.locator('#answer-button').click();await expect(page.locator('#production')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('previous retains actual visited history when switching question order',async({page})=>{
 await page.goto(start);await loaded(page);await page.locator('#next').click();await expect(page).toHaveURL(/Q0002/);await loaded(page);
 await page.locator('[data-mode=random]').click();await expect(page.locator('#previous')).toHaveAttribute('aria-disabled','false');
 await page.locator('#previous').click();await expect(page).toHaveURL(/Q0001/);await page.locator('#next').click();await expect(page).toHaveURL(/Q0002/);
});
test('switching to sequential discards the random forward branch',async({page})=>{
 await page.goto(start+'?mode=random&seed=234&anchor=Q0001');await loaded(page);
 await page.locator('#next').click();await expect(page.locator('article')).not.toHaveAttribute('data-question','Q0001');
 await page.locator('#previous').click();await expect(page).toHaveURL(/Q0001/);
 await page.locator('[data-mode=sequential]').click();await page.locator('#next').click();await expect(page).toHaveURL(/Q0002/);
});
