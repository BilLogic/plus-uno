---
embodiment: ide
summary: How agents write — which of the five files to load, and when.
---

# Writing

How **agents** write: commits, PRDs, Slack replies, share-outs, long-form
recaps. Not product copy — labels, errors and empty states are
`design-system/guidelines/foundations/content/`, because those are read by a
tutor inside the app, not by a colleague reading your output.

The folder carries the shared word, so each file can be named for the job it
governs. Before this split there were two files whose names differed by one word
(`writing-style.md` / `article-writing-style.md`) doing very different jobs, and
a precedence rule existed to arbitrate between homes that were unclear.

| File | Load when | Lines | Bundled |
|------|-----------|------:|:-------:|
| [voice.md](voice.md) | **Always, for any human-facing text.** The house voice, once. | 20 | ✅ |
| [principles.md](principles.md) | Drafting long-form — an article, a recap, a case study. | 197 | — |
| [mechanics.md](mechanics.md) | Editing a draft: sentence and paragraph moves, what never to do, the pre-ship checklist. | 125 | — |
| [registers.md](registers.md) | The audience is not other engineers — product writing, or a findings page. | 102 | — |
| [sources.md](sources.md) | You want to know *why* a rule says what it says. Provenance, not guidance. | 95 | — |

Only `voice.md` is in the uno-bot bundle. The other four are essay-craft the
Worker has no use for — it writes Slack replies, not articles — and bundling
them would add roughly 23% to the prompt for guidance that never fires.

`principles.md` is deliberately over ADR-011's 150-line cap. The reason is in
its own header; do not split it.
