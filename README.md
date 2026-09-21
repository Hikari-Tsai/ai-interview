# Recall — AI Interview Cards

[Traditional Chinese translation](README.zh-TW.md)

Recall turns an AI engineering interview question collection into a multilingual flashcard website. Practice one question at a time, ask for a hint, and reveal an answer organized around **Principle → Trade-off → Implementation → Production**.

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

The starter dataset contains **598 questions** and **8 complete trilingual answer sets**. Select **With answers** to try them. Further generation requires a configured model, API key, and usable source material; other answers remain pending.

See the [maintenance and deployment guide](docs/maintenance.md) for setup, synchronization, and GitHub Pages deployment.

## Automatic updates

The [GitHub Actions workflow](.github/workflows/update-and-deploy.yml) runs daily at **02:17 UTC / 10:17 Taiwan time** and can also be started manually from the Actions tab.

- Tracks the upstream repository and downloads its README only when its content changes or the parser requires a refresh.
- Refreshes due external sources on a weekly cache cycle and retries pending answer generation, with at most 10 model attempts per run.
- Validates data, runs tests, and commits updated records. When site content changes, it rebuilds and deploys to GitHub Pages if deployment is enabled.

The page footer shows the latest recorded question sync or answer generation time in **UTC+8**. Reloading the page does not change this timestamp. Push-triggered runs validate and build the site; they skip source synchronization and answer generation.

Configure an API key in Actions Secrets, model settings in Actions Variables, and GitHub Pages as described in the [maintenance guide](docs/maintenance.md). Automatic answer generation requires a compatible model configuration; the current generator still needs parameter changes for GPT-6 Astra.

## Sources and acknowledgments

The question collection comes from [AI Engineering Interview Questions Company Wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise), hosted under the `pallavi-shekhar` GitHub account. Its README credits **Outcome School** and carries the notice `Copyright (C) 2026 Outcome School`. Thank you to Outcome School and the upstream maintainers and contributors for collecting and organizing the questions and answer links.

Recall imports question text, company/topic groupings, and available answer text or links from that README. Each card preserves a link to the original repository and a commit-pinned source location so readers can check the version used. The original question collection is not authored by this project.

The linked explanations are separate sources, including Outcome School articles and other authors' articles or videos. Credit for those explanations belongs to their respective authors. Cards retain the original explanation links; where supported, the generator reads linked articles to prepare study notes. Full article text is not published in this repository or on the website.

This project adds structured question records, stable question numbers, tags, the flashcard interface, translations, and incremental update automation. It also adds AI-assisted hints and explanations organized around Principle, Trade-off, Implementation, and Production. These notes may contain supplemental examples or recommendations and may contain errors; they are not quotations or official answers approved by the source authors or named companies. Company labels come from the upstream collection and do not imply affiliation or endorsement.

## License

Original project code, documentation, and original contributions are licensed under the [Apache License, Version 2.0](LICENSE), copyright © 2026 Hikari Tsai.

Imported upstream material retains its Apache-2.0 license and original attribution. An unchanged copy of the upstream license is preserved in [licenses/upstream-Apache-2.0.txt](licenses/upstream-Apache-2.0.txt). See [NOTICE](NOTICE) for copyright notices, source attribution, and a description of this project's modifications.

External articles, videos, and other third-party content retain their respective licenses and terms. A link in the upstream README does not make the linked work Apache-2.0, and this project's license does not grant additional rights to it. Dependencies retain their own licenses.
