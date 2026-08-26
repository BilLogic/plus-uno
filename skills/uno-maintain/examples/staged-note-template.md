---
embodiment: ide
summary: Shape of a note staged under docs/knowledge/ — the disposition frontmatter and the four things the note has to say
---

<!-- Template for a note staged under docs/knowledge/ (method.md §7).

     Reach for it rarely. `docs/knowledge/` is a staging area, and the three
     dispositions land content somewhere else: a RULE goes straight into the doc
     that already owns the subject, an ADR into docs/adr/, and most findings are
     worth less than the context they cost and are best left to git. A staged
     note earns its keep when the promotion needs more explanation than the
     promoted line itself carries — the reproduction, the trail, the thing the
     next reader will not believe without evidence.

     The frontmatter below is a contract: `npm run check:knowledge-disposition`
     fails while a file under docs/knowledge/ carries no `disposition:`, and
     `disposition-target:` has to resolve from the repo root. The full contract
     is docs/knowledge/INDEX.md. Land the note, its target and its
     docs/knowledge/changelog.md ledger line in one change; a note is a receipt
     for content that has already landed, so the next sweep clears it. -->
---
disposition: rule                                 # rule | adr | archive
disposition-target: docs/engineering/coding.md    # where the content landed; must resolve
date: YYYY-MM-DD
---

# {What was learned, one specific line}

## Problem

The exact error message, visual symptom, or wrong assumption — specific enough
that someone hitting it again recognises it here.

## Root cause

Traced to the file, config, or convention gap that produced it.

## Fix

The load-bearing snippet or paths, not prose alone.

## Where it landed

The line as it now reads in `disposition-target`, and the
`docs/knowledge/changelog.md` entry that records the promotion. An agent
behaving differently because of that line is the whole return on this note;
everything above is the evidence for it.
