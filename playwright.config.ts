import { defineConfig, devices } from '@playwright/test';
const preview=process.env.TEST_PREVIEW==='1';
const baseURL=preview?'http://127.0.0.1:4322':'http://127.0.0.1:4321';
export default defineConfig({testDir:'tests/e2e',timeout:30000,fullyParallel:true,use:{baseURL,trace:'retain-on-failure'},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],webServer:{command:preview?'npm run preview -- --port 4322 --ignore-lock':'npm run dev -- --port 4321 --ignore-lock',url:baseURL,reuseExistingServer:true,timeout:30000}});
