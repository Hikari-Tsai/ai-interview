import {test,expect} from '@playwright/test';

test('company chips filter sequential and random decks alongside topic filters',async({page})=>{
 await page.goto('/en/questions/Q0001/');
 await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await page.locator('input[name=company][value=OpenAI]').check();
 await expect(page).toHaveURL(/company=OpenAI/);
 await expect(page.locator('.company-tags')).toContainText('OpenAI');
 await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await page.locator('input[name=tag][value=llm]').check();
 await expect(page.locator('.question-tags')).toContainText('LLM');
 await page.locator('#next').click();
 await expect(page.locator('.company-tags')).toContainText('OpenAI');
 await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await page.locator('[data-mode=random]').click();
 await page.locator('#next').click();
 await expect(page.locator('.company-tags')).toContainText('OpenAI');
 await expect(page.locator('.question-tags')).toContainText('LLM');
 await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await page.locator('[data-locale=ja]').click();
 await expect(page.locator('input[name=company][value=OpenAI]')).toBeChecked();
 await page.locator('[data-reset]').first().click();
 await expect(page.locator('input[name=company][value=""]')).toBeChecked();
});

test('card badges use the same company color as sidebar and aliases',async({page})=>{
 await page.goto('/zh-TW/questions/Q0003/');
 const badge=page.locator('[data-filter-company=Meta]');
 await expect(badge).toBeEnabled();
 const color=await badge.getAttribute('style');
 expect(await page.locator('input[name=company][value=Meta] + span').getAttribute('style')).toBe(color);
 await badge.click();
 await expect(page.locator('input[name=company][value=Meta]')).toBeChecked();
 await expect(badge).toHaveAttribute('aria-pressed','true');
 await page.goto('/ja/questions/Q0210/?company=Meta');
 await expect(page.locator('[data-filter-company=Meta]')).toHaveAttribute('style',color!);
 await expect(page.locator('input[name=company][value=Meta]')).toBeChecked();
});
