#!/usr/bin/env bash
# link extraction with rg->grep fallback (rg is not guaranteed on every machine).
# A code span that IS a whole markdown link is blanked first: `[label](url)`
# inside backticks is a doc teaching Markdown syntax, not a link this repo owns,
# and eight of them kept this check permanently red — a check that always fails
# is not a check. Only such spans are blanked, never every code span: the house
# link style is [`path.md`](path.md), and blanking its label would leave `[]()`,
# which the extractor skips — silently unvalidating most links in the repo.
link_grep() {
  sed -E 's/`\[[^`]+\]\([^`]+\)`//g' "$1" | { if command -v rg >/dev/null 2>&1; then rg -o '\[[^]]+\]\(([^)]+)\)'; else grep -oE '\[[^]]+\]\([^)]+\)'; fi; }
}
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

status=0

echo "[check] validating markdown links in skills/ agents/ docs/ design-system/guidelines/ + root"

while IFS= read -r file; do
  while IFS= read -r link; do
    [[ -z "$link" ]] && continue

    # Skip URLs, anchors, mailto
    if [[ "$link" =~ ^(https?://|mailto:|#) ]]; then
      continue
    fi

    # Drop anchor from local links
    link="${link%%#*}"

    # Skip wildcards/placeholders and non-path tokens
    if [[ "$link" == *"*"* || "$link" == *"{"* || "$link" == *"}"* ]]; then
      continue
    fi

    # Resolve relative to current file dir unless link starts at repo root marker
    if [[ "$link" == /* ]]; then
      target="${link#/}"
    else
      target="$(python3 -c 'import os,sys;print(os.path.normpath(os.path.join(sys.argv[1],sys.argv[2])))' "$(dirname "$file")" "$link")"
      target="${target#$ROOT/}"
    fi

    if [[ ! -e "$target" ]]; then
      echo "[missing] $file -> $link (resolved: $target)"
      status=1
    fi
  done < <(link_grep "$file" | sed -E 's/^.*\(([^)]+)\)$/\1/')
# A `transcripts/` folder holds VERBATIM agent output — the paths inside are a
# record of what an agent said, not links this repo owns, and a record you must
# hand-edit to make CI green is not a record. Excluded by folder so the analysis
# written ALONGSIDE it (README.md) stays checked: only the raw record is exempt.
# docs/adr/ is scanned for markdown links but NOT for backticked paths: an ADR's
# job includes naming a path that was retired, and rewriting those would erase
# the decision's own record. Live claims inside ADRs were repointed by hand.
# agents/uno-bot/harness-bundle.md is GENERATED from the swept sources (the
# bundler's readable companion); its links are theirs, already checked at their
# own paths, and re-resolving them from the bundle's directory only invents
# misses. check:retired-spelling skips it for the same reason.
done < <({ find skills agents docs/connectors docs/engineering docs/conventions docs/adr docs/product-and-service design-system/guidelines docs/evals -type f -name '*.md' -not -path '*/node_modules/*' -not -path '*/transcripts/*' -not -path 'agents/uno-bot/harness-bundle.md'; echo AGENTS.md; echo CONTEXT.md; echo SETUP.md; echo README.md; } | sort)

echo "[check] validating backticked repo paths resolve"

# The harness writes almost every path as inline code (`docs/conventions/x.md`),
# not as a markdown link — so the check above sees ~none of them, and a broken
# path passed green for weeks. Only tokens rooted at a known top-level directory
# are checked: anything else is prose, a URL fragment, or another repo's path.
path_grep() {
  if command -v rg >/dev/null 2>&1; then rg -o '`[^`]+`' "$1"; else grep -oE '`[^`]+`' "$1"; fi
}

while IFS= read -r file; do
  while IFS= read -r tok; do
    tok="${tok//\`/}"
    [[ -z "$tok" ]] && continue

    # Only tokens rooted at a real top-level dir of this repo.
    [[ "$tok" =~ ^(AGENTS\.md|docs/|skills/|agents/|scripts/|design-system/|prototypes/|\.github/) ]] || continue

    # Placeholders, globs, ranges, prose fragments, command lines.
    [[ "$tok" == *"*"* || "$tok" == *"{"* || "$tok" == *"<"* || "$tok" == *" "* ]] && continue
    [[ "$tok" == *"\$"* || "$tok" == *"|"* ]] && continue
    # Template placeholders: `…/YYYY-MM-DD-slug.md`, `design-system/src/specs/…`
    [[ "$tok" == *"…"* || "$tok" == *"YYYY"* || "$tok" == *"<name>"* ]] && continue

    # Paths named in order to FORBID them. The doc is correct precisely because
    # the path does not exist; asserting otherwise would invert the rule.
    case "$tok" in
      docs/solutions/*|docs/solutions) continue ;;
    esac

    # Trailing line/anchor references: src/net.ts:42, file.md#section
    tok="${tok%%#*}"
    tok="${tok%%:*}"
    # Trailing punctuation that belongs to the sentence, not the path.
    tok="${tok%,}"; tok="${tok%.}"; tok="${tok%)}"

    [[ -z "$tok" ]] && continue
    if [[ ! -e "$tok" ]]; then
      echo "[missing] $file -> \`$tok\`"
      status=1
    fi
  done < <(path_grep "$file")
# design-system/guidelines/components/overview.md is EXCLUDED by name: it carries
# its own staleness banner (pre-2026-07 component paths, five components that do
# not exist) and #165/#166 own its rebuild. Excluding it keeps 50 known findings
# from burying new ones; it is not a pass.
# docs/connectors/supabase/blueprint.md and blueprint-direct-access.md are VENDORED
# from BilLogic/plus-uno-blueprint by agents/uno-bot/scripts/sync-blueprint-contract.mjs
# and their backticked paths are that repo's (`docs/reference/...`, `scripts/...`).
# Excluded from this pass only; their markdown links are rewritten to GitHub
# URLs at sync time and stay checked above.
done < <({ find skills agents docs/connectors docs/engineering docs/conventions docs/product-and-service design-system/guidelines -type f -name '*.md' -not -path '*/node_modules/*' -not -path 'design-system/guidelines/components/overview.md' -not -path 'docs/connectors/supabase/blueprint.md' -not -path 'docs/connectors/supabase/blueprint-direct-access.md' -not -path 'agents/uno-bot/harness-bundle.md'; echo AGENTS.md; echo CONTEXT.md; echo SETUP.md; } | sort)

echo "[check] validating backticked bare filenames name a file that exists"

# The pass above only checks tokens ROOTED at a top-level directory, so a bare
# `figma-workspace.md` was skipped by design — and that is exactly how it rotted:
# the file moved to docs/connectors/figma.md on 2026-08-24 and four documents went
# on naming the old one for twelve days, until the integrity sweep read the row by
# hand (#408). A bare filename is the easiest path to write and the only one
# nothing checked.
#
# The rule is deliberately weak: the name must exist SOMEWHERE in the repo. It
# cannot be "resolves to one file", because `method.md`, `bot.md` and `SKILL.md`
# each name many real files and are written bare on purpose. Weak still catches
# the whole class here, because a retired file resolves to nothing at all.
#
# docs/adr/ is absent from the sweep set below for the reason the rooted pass
# gives: an ADR's job includes naming a path that was retired. A LINEAGE line
# does the same job — `docs/conventions/writing.md` records that it was distilled
# as writing-style.md — so lineage names a former path without backticks, which
# is what keeps it out of this check.
KNOWN_MD_NAMES="$(find . -name '*.md' -not -path './node_modules/*' -not -path './.git/*' -exec basename {} \; | sort -u)"

while IFS= read -r file; do
  while IFS= read -r tok; do
    tok="${tok//\`/}"
    [[ -z "$tok" ]] && continue
    # Template placeholders, the same ones the rooted pass skips.
    [[ "$tok" == *"*"* || "$tok" == *"<"* || "$tok" == *"YYYY"* || "$tok" == *"…"* ]] && continue
    if ! grep -qxF "$tok" <<< "$KNOWN_MD_NAMES"; then
      echo "[missing] $file -> \`$tok\` (no file of that name exists)"
      status=1
    fi
  done < <(if command -v rg >/dev/null 2>&1; then rg -o '`[^`/ ]+\.md`' "$file"; else grep -oE '`[^`/ ]+\.md`' "$file"; fi || true)
done < <({ find skills agents docs/connectors docs/engineering docs/conventions docs/product-and-service design-system/guidelines -type f -name '*.md' -not -path '*/node_modules/*' -not -path 'agents/uno-bot/harness-bundle.md'; echo AGENTS.md; echo CONTEXT.md; echo SETUP.md; } | sort)

echo "[check] validating AGENTS.md skills-table rows resolve to SKILL.md files"

# NB: process substitution, not a pipeline — status=1 must survive (a `| while`
# subshell silently drops it). Same reason grep gets `|| true`: under
# `set -euo pipefail` a matchless grep would kill the script with no message.
while read -r ref; do
  [[ -z "$ref" ]] && continue
  if [[ ! -f "$ref/SKILL.md" ]]; then
    echo "[missing] AGENTS.md -> $ref/SKILL.md"
    status=1
  fi
done < <(grep -oE 'skills/uno-[a-z-]+' AGENTS.md | sort -u || true)

echo "[check] validating JSON index files"

required_indexes=(
  "design-system/guidelines/index-manifest.json"
  "design-system/guidelines/components/components-index.json"
  "skills/uno-research/references/foundations-index.json"
  "skills/uno-research/references/patterns-index.json"
)

for idx in "${required_indexes[@]}"; do
  if [[ ! -f "$idx" ]]; then
    echo "[missing] required index: $idx"
    status=1
    continue
  fi
  if ! node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$idx" >/dev/null 2>&1; then
    echo "[invalid] invalid JSON: $idx"
    status=1
  fi
done

echo "[check] validating repo paths INSIDE the JSON indexes resolve"

# Existence + JSON.parse says the index is a file and is syntactically JSON. It
# says nothing about the paths the index hands an agent, and those are the whole
# point of an index. #75 (dead design-system/src/forms/ paths) and #76 (four
# `Admin/Tutor Admin/...` segments) both lived inside these files while this
# script printed [ok]. What is and is not covered is documented at the top of
# scripts/validate-index-paths.mjs, next to the matcher that decides.
if ! node scripts/validate-index-paths.mjs; then
  status=1
fi

echo "[check] validating no old path remnants in active files"

old_patterns=(
  "docs/project/"
  "docs/foundations/"
  "docs/design-system/"
  "docs/product-and-service/conventions/"
  "\.agent/"
  "bot-skills/"
  "/uno:"
  "docs/product-and-service/design-system"
  "design-system/docs/"
)

for pattern in "${old_patterns[@]}"; do
  # `|| true` inside the substitution: zero matches is the SUCCESS case, but under
  # pipefail a matchless grep would fail the assignment and kill the script.
  # design-system/docs/ retired in #170 (four homes collapsed into
  # design-system/guidelines/), so it is now itself a stale pattern.
  count=$({ grep -r "$pattern" --include="*.md" --include="*.jsx" --include="*.json" --include="*.mdc" . 2>/dev/null || true; } \
    | { grep -v "node_modules/\|docs/plans/\|docs/knowledge/\|docs/adr/\|todos/\|storybook-static/\|design-system/figma/knowledge-audit.json" || true; } \
    | wc -l | tr -d ' ')
  if [[ "$count" -gt 0 ]]; then
    echo "[stale] $count references to old path pattern: $pattern"
    status=1
  fi
done

if [[ $status -eq 0 ]]; then
  echo "[ok] all validation checks passed"
else
  echo "[fail] validation checks failed — see details above"
fi

exit $status
