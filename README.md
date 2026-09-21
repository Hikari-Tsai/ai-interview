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

## Sources

Questions come from [AI Engineering Interview Questions Company Wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise), maintained by Outcome School. Each card links to the original repository and available explanations. AI-assisted notes are supplementary study material, not official answers endorsed by the source authors.

The upstream Apache-2.0 license is included in [licenses/](licenses/upstream-Apache-2.0.txt).

## License

Original project code and documentation are licensed under the [MIT License](LICENSE), copyright © 2026 Hikari Tsai.

Imported questions and other material from the upstream repository remain under [Apache-2.0](licenses/upstream-Apache-2.0.txt). This project parses and restructures those questions and adds translations and AI-assisted study notes. External articles and other third-party content retain their respective licenses; the MIT License does not grant rights to that content.
