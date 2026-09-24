[![ENGLISH](https://img.shields.io/badge/ENGLISH-456956?style=flat-square)](README.md) [![繁體中文](https://img.shields.io/badge/%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87-737C75?style=flat-square)](README.zh-TW.md)

# Recall — AI Interview Cards

Recall is an **AI interview question bank** and an independent community edition of [AI Engineering Interview Questions Company Wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise). It provides a multilingual static website and uses LLMs to condense source materials into structured study answers. GitHub Actions automatically tracks upstream changes and updates the question bank.

**Many questions still lack answers or need more complete explanations.** Everyone is welcome to discuss approaches and help improve them. To participate, open the [website](https://hikari-tsai.github.io/ai-interview/), find a question, and use **Discuss this question** below the card to enter its discussion area.

Practice one question at a time, ask for a hint, and reveal an answer organized around **Principle → Trade-off → Implementation → Production**.

## Features

- Traditional Chinese, English, and Japanese interfaces and study content.
- Sequential or non-repeating random practice within your selected filters.
- Filter by topic tags, company, keywords, or answer availability.
- Original questions and source links alongside AI-assisted explanations.
- Incremental GitHub Actions updates that process changed content and retry pending work.

Built with Astro and TypeScript. The website is fully static; model calls happen only during content generation. Interface translations live in `lang/`.

## Get started

Requires Node.js 22.12 or later and npm.

```sh
npm ci
npm run dev
```

Open [the local website](http://127.0.0.1:4321).

The dataset contains **598 questions**. Select **With answers** to practice questions with an answer in the current language. Answers are rewritten from the original question and linked article text, not expanded from an earlier short answer. Traditional Chinese explanations target roughly **2,000 characters**, with equivalent detail in English and Japanese. Questions without readable original explanations remain pending.

See the [maintenance and deployment guide](docs/maintenance.md) for setup, synchronization, and GitHub Pages deployment.

## Project structure

```text
.
├── .github/
│   ├── workflows/
│   │   ├── update-and-deploy.yml      # Scheduled sync, generation, build, and deployment
│   │   └── validate-contribution.yml  # PR checks without model secrets or deployment
│   ├── ISSUE_TEMPLATE/               # Answer contribution forms
│   ├── DISCUSSION_TEMPLATE/          # Question discussion forms
│   ├── pull_request_template.md      # Contribution and review checklist
│   └── CODEOWNERS                    # Maintainer review assignments
├── content/community/                # Human-authored Markdown answers, one file per language
├── data/
│   ├── questions/                    # Imported questions, stable IDs, tags, and source links
│   ├── answers/                      # Generated answers and hints in three languages
│   ├── sources/                      # Public source metadata and content hashes, not article text
│   ├── state/                        # Upstream sync progress and generation retry state
│   └── overrides/                    # Optional pinned JSON overrides for maintainers
├── lang/                             # Interface text: zh-TW.json, en.json, ja.json
├── src/
│   ├── pages/                        # Astro routes, question pages, and the public catalog
│   ├── components/                   # Cards, filters, sources, contribution entries, and share metadata
│   ├── client/                       # Browser interactions and navigation
│   ├── lib/                          # Catalog loading, community content, filters, and localization
│   ├── styles/                       # Shared website styles
│   └── config/                       # Project repository configuration
├── scripts/
│   ├── sync.ts                       # Import changed upstream questions and refresh sources
│   ├── generate.ts                   # Generate or retry source-grounded AI answers
│   ├── validate.ts                   # Validate questions, answers, community files, and translations
│   └── lib/                          # Parsing, source extraction, prompts, hashes, and file utilities
├── public/                           # Static assets, favicon, and social-sharing cover
├── tests/                            # Unit and pipeline tests; e2e/ contains browser tests
├── docs/                             # Architecture, maintenance, and design documentation
├── licenses/                         # Preserved upstream license
├── CONTRIBUTING.md                   # Community answer format and submission workflow
├── .env.example                      # Example local generation settings, without credentials
├── astro.config.mjs                  # Static site URL, base path, and build configuration
├── package.json                      # Dependencies and development commands
├── LICENSE                           # Project Apache-2.0 license
└── NOTICE                            # Attribution and modification notices
```

To contribute an answer, add or edit `content/community/Qxxxx/<locale>.md` following [CONTRIBUTING.md](CONTRIBUTING.md). Community answers take priority in their language and are not overwritten by the generator. Use `lang/` for interface wording and `src/components/` for card layout changes.

`dist/` contains the generated website, and `.private/` holds local article snapshots and temporary working files. Both are excluded from Git.

## Contribute an answer

Each card offers **Discuss this question**, **Suggest an answer or fix**, and **Edit the answer**. Use [Discussions](https://github.com/Hikari-Tsai/ai-interview/discussions) to compare approaches, an Issue form to submit text without Git knowledge, or a PR to edit a community Markdown answer. Contributions in any one of the three languages are welcome, including answers to currently pending questions.

Community answers are stored separately from AI output and take priority in their language. Scheduled generation never overwrites them. Maintainers review and merge contributions before the site automatically rebuilds. See the [contribution guide](CONTRIBUTING.md).

## Automatic updates

The [GitHub Actions workflow](.github/workflows/update-and-deploy.yml) runs daily at **02:17 UTC / 10:17 Taiwan time** and can also be started manually from the Actions tab.

- Tracks the upstream repository and downloads its README only when its content changes or the parser requires a refresh.
- Refreshes due external sources on a weekly cache cycle and retries pending answer generation, with at most 10 model attempts per run. Changes to the writing specification also queue existing answers for regeneration. New answers must pass language-specific length, structure, and source-link checks.
- Validates data, runs tests, and commits updated records. When site content changes, it rebuilds and deploys to GitHub Pages if deployment is enabled.
- For scheduled and manual data updates, one additional LLM call summarizes staged content changes in the commit message. It reuses the existing model/key, sends at most 12,000 characters of change details, and skips metadata-only changes. Missing credentials, timeouts or invalid output fall back to a deterministic message without blocking the update.

The page footer shows the latest recorded question sync or answer generation time in **UTC+8**. Reloading the page does not change this timestamp. Push-triggered runs validate and build the site; they skip source synchronization and answer generation.

Configure an API key in Actions Secrets, model settings in Actions Variables, and GitHub Pages as described in the [maintenance guide](docs/maintenance.md). For GPT-6 Astra, set `LLM_MODEL=gpt-6-astra` and `LLM_BASE_URL=https://api.openai.com/v1`, with your OpenAI API key in the `LLM_API_KEY` secret. The generator selects Astra-compatible parameters automatically; your API project must have model access and available quota.

## Sources and acknowledgments

The question collection comes from [AI Engineering Interview Questions Company Wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise), hosted under the `pallavi-shekhar` GitHub account. Its README credits **Outcome School** and carries the notice `Copyright (C) 2026 Outcome School`. Thank you to Outcome School and the upstream maintainers and contributors for collecting and organizing the questions and answer links.

Recall imports question text, company/topic groupings, and available answer text or links from that README. Each card preserves a link to the original repository and a commit-pinned source location so readers can check the version used. The original question collection is not authored by this project.

The linked explanations are separate sources, including Outcome School articles and other authors' articles or videos. Credit for those explanations belongs to their respective authors. Cards retain the original explanation links; where supported, the generator reads linked articles to prepare study notes. Full article text is not published in this repository or on the website.

This project adds structured question records, stable question numbers, tags, the flashcard interface, translations, and incremental update automation. It also adds AI-assisted hints and explanations organized around Principle, Trade-off, Implementation, and Production. These notes may contain supplemental examples or recommendations and may contain errors; they are not quotations or official answers approved by the source authors or named companies. Company labels come from the upstream collection and do not imply affiliation or endorsement.

## License

Original project code, documentation, and original contributions are licensed under the [Apache License, Version 2.0](LICENSE), copyright © 2026 Hikari Tsai.

Imported upstream material retains its Apache-2.0 license and original attribution. An unchanged copy of the upstream license is preserved in [licenses/upstream-Apache-2.0.txt](licenses/upstream-Apache-2.0.txt). See [NOTICE](NOTICE) for copyright notices, source attribution, and a description of this project's modifications.

External articles, videos, and other third-party content retain their respective licenses and terms. A link in the upstream README does not make the linked work Apache-2.0, and this project's license does not grant additional rights to it. Dependencies retain their own licenses.
