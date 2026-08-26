<!-- Tier 2 (on demand) — the contract for this folder, not a note in it. -->
# docs/knowledge/ — the disposition rule

This folder is a staging area, not a library. Work that produces a durable
finding leaves behind **a rule, an ADR, or nothing**, and a file that lands here
is a note in transit between those states.

It reads as sediment when nobody says which. Before #172 it held 15 live files
whose median age was four months: an index that routed to a `decisions.md` split
into `docs/adr/` months earlier, a preferences file every line of which was
already an AGENTS.md hard rule or an ADR, and four "compounding" lesson files
last touched in April. The re-read cost more than every entry was worth.

## The three dispositions

| Disposition | When | Where it lands |
|---|---|---|
| **rule** | An agent would behave differently knowing it. That is the whole test — a rule that restates the model's default is noise, and it is re-read on every turn that loads its doc. | The doc that already owns the subject: `docs/engineering/coding.md`, `docs/engineering/setup.md`, a `docs/connectors/*.md`, a design-system guideline. Never a new rules file. |
| **adr** | Hard to reverse · surprising without the context · a real trade-off. All three, not one. | `docs/adr/NNN-slug.md`, per `docs/adr/overview.md`. |
| **archive** | A record of a superseded era, kept for the trail rather than for use. | `docs/knowledge/archive/`. |

**Deleting is the fourth outcome and the most common one.** It needs no
frontmatter because it leaves no file. Git keeps the trail; a finding worth less
than the context it costs is worth deleting, and promoting something marginal to
avoid the delete is how the folder filled up the first time.

## What the check enforces

`npm run check:knowledge-disposition` fails when a file under `docs/knowledge/`
carries no `disposition:`. Two exclusions, both structural:

- **`docs/knowledge/archive/`** is out of scope. It is the graveyard for
  superseded docs — 30 files across `bot-v1`, `mode-era`, `uno-compound` and
  `uno-review` — and "promote, convert or delete" means nothing there. Archiving
  *is* a disposition; the archive's own contents do not need one.
- **This file and `changelog.md`** govern the folder rather than sitting in it.
  They are named in the script, not exempted by a magic frontmatter value, so
  the exemption cannot spread.

Everything else declares, in frontmatter, where its content went:

```yaml
---
disposition: rule            # rule | adr | archive
disposition-target: docs/engineering/coding.md   # must resolve
---
```

The target is required for `rule` and `adr` and must be a path that exists. A
note carrying a disposition has already been dispositioned — the file is a
receipt, and the next sweep deletes it. Land the note and its disposition in the
same change, and add the ledger line in `changelog.md`; that is what makes the
promotion visible to the next reader instead of implied.
