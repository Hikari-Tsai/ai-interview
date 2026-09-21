# Interview Cards Implementation Plan
> For agentic workers: use superpowers:subagent-driven-development for isolated data-pipeline task and final review; root implements UI in parallel.

**Goal:** Deliver working trilingual flashcards plus maintainable incremental data jobs.
**Architecture:** Astro static pages, typed JSON data, small browser controller for filtered seeded navigation. Node scripts pull pinned Markdown and source articles; bounded model jobs write durable JSON.
**Tech Stack:** Astro, TypeScript, remark, Readability, Zod, node:test, Playwright.
**Spec:** docs/superpowers/specs/2026-09-21-interview-cards-design.md

## Global constraints
zh-TW/en/ja. Every answer links source repo. Never publish article full text or keys. Never silently label unsourced model text as source-backed. No paid provider calls without configured environment. New isolated project /Users/hikaritsai/ai-interview-cards.

## Task 1: ingestion and generation
Files scripts/{sync,generate,validate}.ts, scripts/lib/*.ts, tests/pipeline.test.ts, data/questions/*.json, .github/workflows/*.yml.
Consumes Question/Answer/SourceRecord types. Produces pinned source dataset, conditional source metadata and resumable validated four-section multilingual generation.
- [x] Write tests for AST contexts, source links, stable IDs, removal guard, unchanged generation and provenance.
- [x] Run npm test to establish missing implementation failure.
- [x] Implement parser/reconciler/fetcher/generator and validation; run focused tests.
- [x] Fetch real source data; prove second sync skips unchanged README.

## Task 2: practice navigation and static surface
Files src/lib/session.ts, src/lib/catalog.ts, src/pages/[locale]/questions/[id].astro, src/components/*, src/styles/app.css, lang/*.json; tests/session.test.ts.
Consumes Card[]; produces filterCards(cards,filters), orderedIds(cards,mode,seed,anchor), and static localized pages.
- [x] Write tests ensuring all/any filtering, deterministic unique shuffle, retained anchor and ascending default.
- [x] Run test before implementation; implement state utilities; run test again.
- [x] Build localized responsive shell/card/source/footer components; URL contains tag/match/company/search/mode/seed/anchor, path contains current ID.
- [x] Implement hint/reveal reset on navigation, language persistence and single/no-result handling.

## Task 3: source-grounded initial examples and verification
Files data/answers/*.json, README.md, .env.example, tests/e2e/* and playwright.config.ts.
- [x] Read external articles for initial ready examples and record used URLs; remaining cards explicitly pending API generation.
- [x] Run npm run check, npm test, npm run build.
- [x] Browser tests: hidden answer, hint, reveal, next/previous, tags any/all, random no-repeat, all locales, empty result and mobile overflow.
- [x] Inspect desktop/mobile screenshots, resolve regressions, document credential/deployment limits and exact commands.

## Verification and implementation decisions
Implemented native CSS UI because built-in image generation is unavailable. Playwright Chromium used because no Browser/IAB capability exists. Actual source data + eight source-reviewed answer sets included; no paid LLM calls made without configured credentials/model. Source fetch allowlist supports OutcomeSchool blog/Substack; other original links preserved. Forward history is truncated when changing order mode; past visits remain intact.
