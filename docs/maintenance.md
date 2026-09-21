# Maintenance and Deployment Guide

A static, source-linked interview study app in Traditional Chinese, English and Japanese. One question per page, hidden answers, independent hints, topic/company/search filters and sequential or seeded random practice.

[Back to the project overview](../README.md)

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4321. The initial dataset contains **598 real questions** from the upstream README and **8 source-reviewed trilingual answers**. Other answers visibly remain pending; they are not fake generated content. Use “With answers” to practice the complete starter set.

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

Set **LLM_API_KEY** (or OPENAI_API_KEY) and **LLM_MODEL** in the job environment. **LLM_BASE_URL** optionally selects an OpenAI-compatible Chat Completions provider; default is `https://api.openai.com/v1`. The chosen model must support JSON output and the configured request parameters. The Astra integration has been verified with live generation. API access and quota still depend on the configured account.

For **GPT-6 Astra**, set `LLM_MODEL=gpt-6-astra` and `LLM_BASE_URL=https://api.openai.com/v1`. The generator uses `max_completion_tokens` and `reasoning_effort: low`, omitting `temperature`, according to the [official Astra migration guide](https://developers.openai.com/api/docs/guides/latest-model#update-api-and-model-parameters). Other model names retain the existing `max_tokens` and `temperature: 0.2` request format. Your OpenAI API project must have access to Astra and available quota; selecting a model in Codex does not configure the workflow's API credentials.

For Astra, `LLM_MAX_TOKENS` covers both reasoning and visible output tokens. The long-form default is 16,000 and the maximum is 24,000. Truncated responses, refusals, empty responses, and invalid JSON are recorded as failed jobs for later retry; they do not replace the last successful answer. These cases are tested against a local simulated Chat Completions endpoint. To override the token budget in Actions, set the `LLM_MAX_TOKENS` repository Variable; the workflow defaults to 16,000 when it is unset.

For local jobs, copy `.env.example` to `.env`, edit it locally, then load it with your preferred environment manager. Alternatively Node supports:

```sh
node --env-file=.env --import tsx scripts/generate.ts
```

Do not commit keys. GitHub Actions uses repository secrets. Missing credentials leave jobs pending; they do not replace source-reviewed starter answers with fabricated output. Source-less questions remain pending until supported evidence exists. Each successful generation is validated for all three languages, the four sections and permitted source URLs. Engineering supplements are labeled explicitly.

`GENERATION_LIMIT` limits model attempts per run (default 10, maximum 1,000 for explicit local migrations). `GENERATION_IDS` optionally restricts a local run to comma-separated question IDs. `LLM_SOURCE_CHAR_LIMIT` caps total source characters per request (default 30,000); `LLM_MAX_TOKENS` caps model output including reasoning (default 16,000). Questions without usable sources do not consume the model-attempt budget. `GENERATION_SOURCE_FETCH_LIMIT` bounds article refetches (default 10). `npm run generate -- --force` explicitly refreshes eligible answers within these limits. Model/prompt/semantic input changes invalidate prior generated content; changes limited to company, topic or tag metadata do not trigger model generation. Stale answers are preserved in data but not displayed as current answers.

## Long-form answer specification

`grounded-longform-v2` rereads the original question, README answer, and up to 30,000 characters of linked article text. Previous answers are never included in the prompt. Traditional Chinese targets 1,800–2,400 non-whitespace characters across the four answer sections; English targets 750–1,100 words, and Japanese 2,000–2,800 characters. The introduction, hints, and source note are additional to those body targets.

The validator allows 1,700–2,800 characters for Traditional Chinese, 650–1,400 words for English, and 1,700–3,400 characters for Japanese. This gives the model some room for topic-specific explanations while rejecting short summaries. Each section must also be substantive. The prompt asks for a direct answer, prerequisite explanations, worked examples when useful, assumptions, engineering trade-offs and operational checks in short paragraphs. Engineering supplements must be identified separately from source-backed claims. Length validation is not factual verification.

The prompt version is part of the input fingerprint, so old short answers are regenerated even if the upstream article is unchanged. Historical records can still be read. Source-reviewed starter answers are also eligible for migration; pinned editorial overrides remain protected. Questions without usable original source articles stay pending. Each model request has a five-minute timeout; rejected or truncated responses are queued for retry without replacing the previous answer text.

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

## Project links

Set `repositoryUrl` in `src/config/site.json` to this project's GitHub URL. `PROJECT_REPO_URL` overrides it. If neither is set, builds in GitHub Actions use `GITHUB_REPOSITORY`. Until a project URL is available, project-specific links are hidden. The header GitHub icon, star link, and footer project link share this setting; original question-source links remain separate.
