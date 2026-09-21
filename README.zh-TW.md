# Recall — AI 面試題卡

[English README](README.md)

Recall 將 AI 工程面試題庫轉換成多語言單字卡式網站。每次練習一道題目，先查看答題提示，再展開依照 **原理 → 取捨 → 實作 → 上線實務** 整理的答案。

## 功能

- 提供繁體中文、英文與日文介面及學習內容。
- 在選定的篩選範圍內，依序出題或進行同輪不重複的隨機練習。
- 依主題標籤、公司、關鍵字或答案狀態篩選。
- 保留原始題目與來源連結，搭配 AI 輔助整理的解說。
- 使用 GitHub Actions 增量更新，只處理變更內容並重試待完成的工作。

使用 Astro 與 TypeScript 建置。網站完全靜態化，只有生成內容時才呼叫模型。介面翻譯集中維護於 `lang/`。

## 開始使用

需要 Node.js 22.12 以上版本與 npm。

```sh
npm ci
npm run dev
```

開啟[本機網站](http://127.0.0.1:4321)。

初始資料包含 **598 道題目**與 **8 組完整三語答案**。勾選「**已有答案**」即可試用。後續生成需要設定模型、API 金鑰，並具備可用的來源資料；其他答案會維持待生成狀態。

設定、同步與 GitHub Pages 部署方式，請參閱[維護與部署指南（英文）](docs/maintenance.md)。

## 資料來源

題目來自 Outcome School 維護的 [AI Engineering Interview Questions Company Wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise)。每張題卡皆連結至原始 repo 與可用的解答資源。AI 輔助筆記是補充學習資料，並非經來源作者認可的官方答案。

上游的 Apache-2.0 授權條款收錄於 [licenses/](licenses/upstream-Apache-2.0.txt)。
