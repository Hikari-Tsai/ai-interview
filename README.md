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

## Sources

Questions come from [AI Engineering Interview Questions Company Wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise), maintained by Outcome School. Each card links to the original repository and available explanations. AI-assisted notes are supplementary study material, not official answers endorsed by the source authors.

The upstream Apache-2.0 license is included in [licenses/](licenses/upstream-Apache-2.0.txt).

## License

Original project code and documentation are licensed under the [MIT License](LICENSE), copyright © 2026 Hikari Tsai.

Imported questions and other material from the upstream repository remain under [Apache-2.0](licenses/upstream-Apache-2.0.txt). This project parses and restructures those questions and adds translations and AI-assisted study notes. External articles and other third-party content retain their respective licenses; the MIT License does not grant rights to that content.
