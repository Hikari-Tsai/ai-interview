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

## 自動更新

[GitHub Actions 工作流程](.github/workflows/update-and-deploy.yml) 每天於 **UTC 02:17／台灣時間 10:17** 執行，也可在 Actions 分頁手動啟動。

- 追蹤上游 repo，僅在 README 內容變更或解析器需要重新處理時下載。
- 依每週快取週期更新到期的外部來源，並重試待生成答案；每次最多嘗試呼叫模型 10 次。
- 驗證資料、執行測試並提交更新。網站內容有變更且已啟用部署時，重新建置並發布至 GitHub Pages。

網頁頁尾以 **UTC+8** 顯示題庫最近同步或答案最近生成中較新的時間，重新整理頁面不會改變此紀錄。Push 觸發的流程會驗證及建置網站，跳過來源同步與答案生成。

請依[維護指南](docs/maintenance.md) 在 Actions Secrets 設定 API Key、在 Actions Variables 設定模型參數，並啟用 GitHub Pages。答案自動生成需要相容的模型設定；目前生成程式仍需調整參數才能使用 GPT-6 Astra。

## 資料來源與致謝

題庫來自 GitHub 帳號 `pallavi-shekhar` 下的 [AI Engineering Interview Questions Company Wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise)。原始 README 署名 **Outcome School**，並載有 `Copyright (C) 2026 Outcome School` 聲明。感謝 Outcome School，以及上游維護者與貢獻者蒐集、分類面試題目並整理解答連結。

Recall 從該 README 匯入題目文字、公司與主題分類，以及現有的答案文字或連結。每張題卡保留原始 repo 連結與固定 commit 的來源位置，方便讀者核對當時使用的版本。原始題庫並非本專案所創作。

解答連結指向獨立的內容來源，包括 Outcome School 文章，以及其他作者的文章或影片；這些解答的創作歸功於各自作者。題卡保留原始解答連結，生成程式會在支援的情況下讀取連結文章，整理成學習筆記。本 repo 與網站不公開文章全文。

本專案新增結構化題目資料、固定題號、標籤、題卡介面、翻譯及增量更新流程，也加入 AI 輔助整理的答題提示，以及依原理、取捨、實作與上線實務編排的解說。這些筆記可能包含補充範例或建議，也可能有錯誤；它們不是原文引述，也不是經來源作者或題目所列公司核可的官方答案。公司標籤沿用上游分類，不代表合作或背書。

## 授權

本專案原創程式碼、文件與原創貢獻採用 [Apache License 2.0](LICENSE)，著作權所有 © 2026 Hikari Tsai。

匯入的上游內容保留 Apache-2.0 授權與原作者署名。原始授權檔未經修改，存放於 [licenses/upstream-Apache-2.0.txt](licenses/upstream-Apache-2.0.txt)。著作權聲明、來源及本專案修改範圍，請參閱 [NOTICE](NOTICE)。

外部文章、影片及其他第三方內容仍依各自的授權與使用條款。被上游 README 連結引用，不代表該作品也採用 Apache-2.0；本專案的授權不會額外授予這些內容的使用權。相依套件也保留各自的授權。
