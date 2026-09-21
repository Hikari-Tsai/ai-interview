# Recall — AI interview cards

A static, source-linked interview study app in Traditional Chinese, English and Japanese. One question per page, hidden answers, independent hints, topic/company/search filters and sequential or seeded random practice.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4321. The initial dataset contains **598 real questions** from the upstream README and **8 source-reviewed trilingual answers**. Other answers visibly remain pending; they are not fake generated content. Use “With answers / 已有答案” to practice the complete starter set.

## Interaction

- Each card retains its permanent Q number and its own `/{locale}/questions/{id}/` URL.
- Answers start hidden. Hints independently reveal the suggested approach.
- Answers follow Principle → Trade-off → Implementation → Production and always link the original GitHub README and repo.
- Filters use any/all tag matching; company and text search further narrow the deck.
- Sequential mode sorts by permanent number. Random shuffles eligible cards without repetition and preserves its seed in the URL. Previous follows that order; a finished random round can reshuffle.
- Changing mode keeps the current card. Changing filters retains it if eligible; otherwise opens the first matching card. Each new card hides hints and answers again.
- Language links preserve the current card and filters. UI copy and tag labels live in `lang/zh-TW.json`, `lang/en.json`, `lang/ja.json`.

## Architecture

```text
lang/                       Interface and tag translations (identical keys)
src/components/             Header, filters, question, answer, original sources
src/client/study.ts         Filter + URL + disclosure browser interactions
src/lib/session.ts          Pure filtered-deck and seeded shuffle functions
src/pages/                  3-language per-question static routes + shared index
src/styles/app.css          Responsive design tokens and components
data/questions/Q*.json      Stable IDs, original question, topics, provenance
data/answers/Q*.json        Source-grounded trilingual answers and generation metadata
data/sources/               Public article metadata only; no article full text
data/overrides/             Optional pinned editorial Answer records
data/state/                 Durable ingestion/generation progress and retries
.private/                   Gitignored README/article snapshots (local only)
scripts/                    Sync, generation, validation
.github/workflows/          Daily incremental update, validation, build, optional Pages deploy
```

The frontend makes no model requests. Astro builds static HTML; one shared catalog supports browser filtering. External article prose and API credentials never enter the public bundle.

## Data updates

```sh
npm run sync
npm run generate
npm run validate
npm run build
```

Sync pins an upstream commit, compares the README blob SHA using Git tree metadata and downloads the Markdown only when it changes. It parses the complete changed Markdown with an AST, then reconciles questions. Parser versions are tracked too; parser upgrades or `npm run sync -- --reparse` reprocess the README even if its blob is unchanged. Exact questions retain IDs across reorder/moves; ambiguous or substantial rewrites get a new ID and retire the old record. A large removal guard blocks suspicious updates. Retired URLs remain available.

Articles are deduplicated by URL, refreshed after a seven-day TTL and checked using ETag/Last-Modified when supported. Only normalized body changes affect answers. Currently supported full-text sources: Outcome School blog and its Substack; video/social links remain preserved but unsupported for transcription. Other domains require adding a reviewed allowlist entry. Private snapshots are not uploaded to public Actions caches. Fresh runners may need to refetch a relevant article body, within the configured fetch budget.

`npm run sync -- --refresh-sources` forces a bounded article refresh. `SOURCE_FETCH_LIMIT` defaults to 20 (maximum 200). Missing/failed generation jobs remain resumable even when README has not changed.

## Configure a model

Set **LLM_API_KEY** (or OPENAI_API_KEY) and **LLM_MODEL** in the job environment. **LLM_BASE_URL** optionally selects an OpenAI-compatible Chat Completions provider; default is `https://api.openai.com/v1`. The chosen model must support JSON output and the configured request parameters. No paid provider was called to create this project; live-provider compatibility remains to be verified after configuration.

For local jobs, copy `.env.example` to `.env`, edit it locally, then load it with your preferred environment manager. Alternatively Node supports:

```sh
node --env-file=.env --import tsx scripts/generate.ts
```

Do not commit keys. GitHub Actions uses repository secrets. Missing credentials leave jobs pending; they do not replace source-reviewed starter answers with fabricated output. Source-less questions remain pending until supported evidence exists. Each successful generation is validated for all three languages, the four sections and permitted source URLs. Engineering supplements are labeled explicitly.

`GENERATION_LIMIT` limits model attempts per run (default 10). `LLM_SOURCE_CHAR_LIMIT` caps total source characters per request (default 30,000); `LLM_MAX_TOKENS` caps model output (default 7,000). Questions without usable sources do not consume the model-attempt budget. `GENERATION_SOURCE_FETCH_LIMIT` bounds article refetches (default 10). `npm run generate -- --force` explicitly refreshes eligible answers within these limits. Model/prompt/semantic input changes invalidate prior generated content; changes limited to company, topic or tag metadata do not trigger model generation. Stale answers are preserved in data but not displayed as current answers.

## Editorial corrections

Store `data/overrides/Q0001.json` with `{ "pin": true, "answer": <complete Answer object> }`. Copy a real answer object as the starting point, retain its provenance and set its correct input version. Pinned edits are never silently replaced by model output. When the question or dependencies change, review and refresh the editorial record before publishing it as current. Source schema: `src/lib/types.ts`.

## GitHub Actions and Pages

The included workflow supports a daily cron and manual runs. It synchronizes, retries pending generation, tests, type-checks and builds before committing durable data. It deploys that exact build in the same workflow, avoiding the `GITHUB_TOKEN` push-trigger trap. Unchanged scheduled runs skip building and deploying; durable state still passes validation.

1. Push this project to your own GitHub repository.
2. Set repository secret `LLM_API_KEY` and variable `LLM_MODEL` for automatic answers; optionally set `LLM_BASE_URL`.
3. Select **GitHub Actions** as the Pages build source.
4. Set variables `SITE_URL` to the Pages host and `BASE_PATH` to `/repository-name` (or `/` for a root/custom-domain site).
5. Set `DEPLOY_PAGES=true`, or enable deploy in a manual workflow run.

The workflow needs permission to push data commits. Branch-protected repositories should replace direct data pushes with an approved bot/PR arrangement. GitHub scheduled runs can be delayed and public-repo schedules may be disabled after 60 days of inactivity. No remote repository or public deployment has been created by this implementation.

## Verify

```sh
npm test
npm run check
npm run validate
npm run build
npm run test:e2e
# Verify the built static site after npm run build:
TEST_PREVIEW=1 npm run test:e2e
```

For a fresh environment, `npx playwright install chromium` installs the browser used by UI tests. Tests cover bounded random decks, any/all filters, locale preservation, source links, hidden answers, navigation, empty/single-result states, mobile layout, parsing, stable IDs, source security and provider retry/provenance behavior.

## Attribution

Original questions: [AI Engineering Interview Questions Company Wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise), maintained by Outcome School. Every card links its immutable source location. The upstream repository includes Apache-2.0; a copy is preserved at `licenses/upstream-Apache-2.0.txt`. External article links and paraphrased study notes are distinct from the README; external articles are not republished in full. The eight initial answer sets are AI-assisted, source-reviewed examples, not an endorsement by the original author.
