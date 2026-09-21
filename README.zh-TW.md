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

題庫包含 **598 道題目**。勾選「**已有答案**」即可練習目前語言已有解答的題目。答案會重新讀取原始題目與連結文章後改寫，不是從舊短版擴寫。繁中解說以約 **2,000 字**為目標，英文與日文維持相同解說深度；沒有可讀取原始解答的題目保留待補狀態。

設定、同步與 GitHub Pages 部署方式，請參閱[維護與部署指南（英文）](docs/maintenance.md)。

## 檔案結構

```text
.
├── .github/
│   ├── workflows/
│   │   ├── update-and-deploy.yml      # 定時同步、生成答案、建置與部署
│   │   └── validate-contribution.yml  # PR 檢查，不使用模型金鑰或部署網站
│   ├── ISSUE_TEMPLATE/               # 答案投稿表單
│   ├── DISCUSSION_TEMPLATE/          # 題目討論表單
│   ├── pull_request_template.md      # 投稿與審閱確認項目
│   └── CODEOWNERS                    # 維護者審閱分工
├── content/community/                # 人工撰寫的 Markdown 答案，每種語言獨立一份
├── data/
│   ├── questions/                    # 匯入的題目、固定題號、標籤與來源連結
│   ├── answers/                      # 生成的三語答案與答題提示
│   ├── sources/                      # 公開來源資訊與內容雜湊，不含文章全文
│   ├── state/                        # 上游同步進度與答案生成重試狀態
│   └── overrides/                    # 維護者可選用的固定 JSON 覆寫答案
├── lang/                             # 介面文字：zh-TW.json、en.json、ja.json
├── src/
│   ├── pages/                        # Astro 路由、題目頁面與公開題庫索引
│   ├── components/                   # 題卡、篩選器、來源、投稿入口與分享資訊
│   ├── client/                       # 瀏覽器互動與題目導覽
│   ├── lib/                          # 題庫讀取、社群內容、篩選與多語言邏輯
│   ├── styles/                       # 網站共用樣式
│   └── config/                       # 專案 Repo 設定
├── scripts/
│   ├── sync.ts                       # 匯入上游題目差異並更新來源資料
│   ├── generate.ts                   # 根據來源生成 AI 答案，或重試失敗項目
│   ├── validate.ts                   # 驗證題目、答案、社群檔案與翻譯
│   └── lib/                          # 解析、文章擷取、提示詞、雜湊與檔案工具
├── public/                           # 靜態資源、網站圖示與社群分享封面
├── tests/                            # 單元與資料流程測試；e2e/ 為瀏覽器測試
├── docs/                             # 架構、維護與設計文件
├── licenses/                         # 保留的上游授權文件
├── CONTRIBUTING.md                   # 社群答案格式與投稿流程
├── .env.example                      # 本機生成設定範例，不含金鑰
├── astro.config.mjs                  # 靜態網站網址、基底路徑與建置設定
├── package.json                      # 相依套件與開發指令
├── LICENSE                           # 專案 Apache-2.0 授權
└── NOTICE                            # 來源署名與修改聲明
```

投稿答案時，請依照 [CONTRIBUTING.md](CONTRIBUTING.md) 新增或編輯 `content/community/Qxxxx/<語言>.md`。社群答案會優先顯示於對應語言，生成程式不會覆寫。介面文案放在 `lang/`，題卡版面則主要位於 `src/components/`。

`dist/` 是建置後的網站，`.private/` 存放本機文章快照與暫存工作檔案，兩者都不提交至 Git。

## 自動更新

[GitHub Actions 工作流程](.github/workflows/update-and-deploy.yml) 每天於 **UTC 02:17／台灣時間 10:17** 執行，也可在 Actions 分頁手動啟動。

- 追蹤上游 repo，僅在 README 內容變更或解析器需要重新處理時下載。
- 依每週快取週期更新到期的外部來源，並重試待生成答案；每次最多嘗試呼叫模型 10 次。寫作規格變更時，現有答案也會排入重新生成；新答案須通過各語言的篇幅、結構與來源連結檢查。
- 驗證資料、執行測試並提交更新。網站內容有變更且已啟用部署時，重新建置並發布至 GitHub Pages。

網頁頁尾以 **UTC+8** 顯示題庫最近同步或答案最近生成中較新的時間，重新整理頁面不會改變此紀錄。Push 觸發的流程會驗證及建置網站，跳過來源同步與答案生成。

請依[維護指南](docs/maintenance.md) 在 Actions Secrets 設定 API Key、在 Actions Variables 設定模型參數，並啟用 GitHub Pages。使用 GPT-6 Astra 時，設定 `LLM_MODEL=gpt-6-astra`、`LLM_BASE_URL=https://api.openai.com/v1`，並將 OpenAI API Key 放入 `LLM_API_KEY` Secret。生成程式會自動使用 Astra 相容參數；你的 API 專案需具備模型存取權及可用額度。

## 資料來源與致謝

題庫來自 GitHub 帳號 `pallavi-shekhar` 下的 [AI Engineering Interview Questions Company Wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise)。原始 README 署名 **Outcome School**，並載有 `Copyright (C) 2026 Outcome School` 聲明。感謝 Outcome School，以及上游維護者與貢獻者蒐集、分類面試題目並整理解答連結。

Recall 從該 README 匯入題目文字、公司與主題分類，以及現有的答案文字或連結。每張題卡保留原始 repo 連結與固定 commit 的來源位置，方便讀者核對當時使用的版本。原始題庫並非本專案所創作。

解答連結指向獨立的內容來源，包括 Outcome School 文章，以及其他作者的文章或影片；這些解答的創作歸功於各自作者。題卡保留原始解答連結，生成程式會在支援的情況下讀取連結文章，整理成學習筆記。本 repo 與網站不公開文章全文。

本專案新增結構化題目資料、固定題號、標籤、題卡介面、翻譯及增量更新流程，也加入 AI 輔助整理的答題提示，以及依原理、取捨、實作與上線實務編排的解說。這些筆記可能包含補充範例或建議，也可能有錯誤；它們不是原文引述，也不是經來源作者或題目所列公司核可的官方答案。公司標籤沿用上游分類，不代表合作或背書。

## 授權

本專案原創程式碼、文件與原創貢獻採用 [Apache License 2.0](LICENSE)，著作權所有 © 2026 Hikari Tsai。

匯入的上游內容保留 Apache-2.0 授權與原作者署名。原始授權檔未經修改，存放於 [licenses/upstream-Apache-2.0.txt](licenses/upstream-Apache-2.0.txt)。著作權聲明、來源及本專案修改範圍，請參閱 [NOTICE](NOTICE)。

外部文章、影片及其他第三方內容仍依各自的授權與使用條款。被上游 README 連結引用，不代表該作品也採用 Apache-2.0；本專案的授權不會額外授予這些內容的使用權。相依套件也保留各自的授權。


## 一起補充答案

每張題卡都提供「討論這題」「補充／修正答案」「編輯答案」。可以在 [Discussions](https://github.com/Hikari-Tsai/ai-interview/discussions) 討論解法，使用 Issue 表單投稿，或以 PR 修改社群 Markdown 答案。不熟 Git 也可以直接在表單貼上文字，由維護者整理。沒有原始解答的待補題目，也歡迎社群補上；一次貢獻一種語言即可。

社群內容獨立存放於 `content/community/Qxxxx/<語言>.md`，合併後優先顯示該語言的社群答案。Cron 不會覆寫這些檔案；上游題目或原始來源有變更時，保留內容並標記待複核。PR 通過維護者審閱、合併後才自動部署。詳細格式與流程請見 [投稿指南](CONTRIBUTING.md)。
