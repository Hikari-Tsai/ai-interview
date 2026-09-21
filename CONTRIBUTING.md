# Contributing interview answers

English, Traditional Chinese, and Japanese contributions are welcome. You can contribute one language at a time. You do not need to translate an answer into all three languages or have an original upstream answer available.

Every question card has three contribution entries, available even while its answer is hidden or pending:

- **Discuss this question**: search existing discussions by the stable question ID, or start a Q&A discussion. Keep `[Q0001]` in the title. All languages share that ID; please reuse an existing relevant thread.
- **Suggest an answer or fix**: submit an Issue form. The website prefills the question ID, page URL, original source, and language. Paste your proposed explanation, correction, or references; maintainers can turn it into a PR for you.
- **Edit the answer**: open GitHub's editor for the current language's community Markdown file. If the file does not exist, the link opens a new-file editor with a starter template. Sign in to GitHub; contributors without write access use a fork and pull request. The website's current answer remains available as a reference.

Submissions do not publish automatically. Maintainers review the technical content and merge an accepted PR. That merge triggers the site's existing build and deployment workflow. Marking a Discussion reply as an answer does not publish it on the website.

## Writing a community answer

Use `content/community/Q0001/en.md`, `zh-TW.md`, or `ja.md` for the appropriate question and language. Do not edit `data/answers/`: those files are generated automatically.

The web editor's starter includes YAML frontmatter with the question's current review fingerprint and original source links. Complete these fields:

| Field | Meaning |
| --- | --- |
| `questionId`, `locale` | Must match the directory and filename. |
| `title` | The question title in the contribution's language. |
| `intent` | What the interviewer is assessing. |
| `hint` | One to six short hints, as a YAML list. |
| `authors` | One or more GitHub usernames, without `@`. Credit the actual authors. |
| `updatedAt` | Revision time in ISO 8601, for example `2026-09-21T06:00:00Z`. |
| `reviewedAgainst` | The question/source fingerprint supplied by the starter. Update it only after reviewing changed source material. |
| `sourceUrls` | HTTPS references, including the original repository and the commit-pinned question link already provided. Add primary sources and reproducible evidence where appropriate. |

Write the answer under these exact level-two headings. The headings stay in English in the file; the website uses localized section labels:

```markdown
## Principle
Answer the question directly, then explain the mechanism and assumptions.

## Trade-off
Compare realistic alternatives and the conditions that change the choice.

## Implementation
Describe concrete steps, meaningful tests, and code where useful.

## Production
Explain failure modes, diagnostics, operating limits, and deployment considerations.

## Advanced
Optional derivations, deeper examples, or further discussion.
```

All four main sections must be nonempty. `Advanced` is optional and appears collapsed on the website. Use level-three headings for subsections within a main section. Markdown paragraphs, lists, links, fenced code, and blockquotes are supported; executable HTML and MDX are not. Keep code lines reasonably short for mobile readers.

Community contributions do not have the AI generator's 2,000-character target. Prioritize depth and clarity. A small correction can be submitted as an Issue instead of rewriting the whole answer.

### Formulas

The four answer sections and the community-only Advanced section support KaTeX math. Use `$...$` for inline notation and `$$` on separate lines for a display equation:

```markdown
Divide by $\sqrt{d_k}$ to control the score scale.

$$
\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$
```

Explain each symbol and the assumptions in the surrounding text. Question titles also support inline `$...$` formulas; keep them short and avoid display equations in headings. Existing plain-text title notation (`1/sqrt(d_k)`, `O(1)`, `n > 1`, and `<100 ms`) is formatted automatically at build time without modifying source data. Keep hints and other metadata as plain text. Put literal dollar-containing code in backticks in Markdown; escape currency dollar signs as `\$` in Markdown.

Generated JSON uses the same formula delimiters within the existing section strings. JSON requires doubled backslashes and escaped newlines, for example:

```json
{"principle": "Divide by $\\sqrt{d_k}$.\n\n$$\nx^2\n$$"}
```

Use JSON serialization when writing these files programmatically. Generated prose remains plain text outside formulas; Markdown formatting is reserved for community answers. Math is rendered during the static build with local fonts and CSS. Invalid LaTeX fails the build; HTML and trusted LaTeX commands are disabled. Long display equations scroll horizontally on small screens.

Distinguish source-backed facts, your own reasoning, and personal experience. Explain formula assumptions, identify illustrative numbers as examples, and provide evidence for benchmark claims. Do not copy full third-party articles or claim to represent a company's undisclosed internal implementation. Original contributions follow the project's Apache-2.0 license; preserve third-party attribution and applicable rights.

## Review and maintenance

A merged community answer takes precedence over AI content **only for its own language**. Other languages keep their available AI or community answers. Missing translations remain pending. The ready-answer filter follows the currently displayed language.

The daily generator writes only its existing generated-data paths. It never writes `content/community/`. If the original question or extracted upstream source hashes change, the community answer stays visible with a **needs another review** notice. Additional references contributed by humans are not automatically crawled. Maintainers review their currency manually.

The website shows contributor profiles, revision time, references, and Git history. Git history links each revision to its commit and associated PR where available. An answer's presence on the site means it was merged, not that automated checks proved it correct.

CODEOWNERS requests maintainer review of community files. Maintainers should review the four answer sections, additional references, language, and changed assumptions before merging; CI checks syntax and structure, not factual correctness. This setup does not change branch protection or automatically merge contributions.

To inspect the current fingerprint for a question after reviewing its source changes:

```sh
npx tsx -e "import {loadCards} from './src/lib/catalog.ts'; console.log(loadCards().find(q=>q.id==='Q0001')?.communityHash)"
```

## Local checks

```sh
npm ci
npm run validate
npm test
npm run check
npm run build
npm run dev
```

The **Validate contribution** PR workflow uses a read-only GitHub token and does not load model secrets, call models, synchronize sources, commit data, or deploy. It also runs for forks, subject to GitHub's approval requirements for first-time contributors. Maintainers must not change it to `pull_request_target` to execute contribution code with elevated permissions.
