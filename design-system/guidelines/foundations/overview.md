---
summary: The fourteen foundations, following Atlassian's set
---

<!-- Tier: 2 -->

# Foundations

The fourteen foundations, following Atlassian's set. A new foundation doc has
exactly one correct slot; a foundation earns a folder only when it needs a second
topic, which today only `content/` does.

| Foundation | Authored | Answers |
|------------|:--------:|---------|
| [tokens.md](tokens.md) | ✅ | Which semantic layer does this value come from? |
| [accessibility.md](accessibility.md) | ✅ | What does WCAG 2.1 AA require here? |
| [content/](content/overview.md) | ◐ | What does this button, error, or empty state say? |
| [spacing.md](spacing.md) | ✅ | How much padding, margin, gap? |
| [grid.md](grid.md) | ✅ | Breakpoints and column spans |
| [color.md](color.md) | ✅ | Which colour, and what does it mean? |
| [typography.md](typography.md) | ✅ | Which type class and weight? |
| [motion.md](motion.md) | ✕ | Duration, easing, what may animate |
| [iconography.md](iconography.md) | ✅ | Which icon set, which size |
| [illustrations.md](illustrations.md) | ✕ | Illustration style and assets |
| [logos.md](logos.md) | ✕ | The marks, clear space, variants |
| [elevation.md](elevation.md) | ✅ | Which shadow step for which surface |
| [border.md](border.md) | ✕ | Border widths |
| [radius.md](radius.md) | ✕ | Corner radius scale |

**8 of 14 authored, 1 partial, 5 empty.** ✕ means a named empty slot: the file
exists, says so, and promises nothing. That is deliberate — a gap you can see
beats a gap you discover mid-build, and it is not a stub, because there is no
template inviting someone to fill in a heading with "TODO".

## Reading order

Start at [tokens.md](tokens.md). Every other foundation names tokens, and the
decision tree there is what tells you which layer a value belongs to. Token
*names* are generated into `design-system/agent-views/tokens/tokens.md`; the
foundations say which to reach for and why.

## Known drift

Several foundations were written ahead of the SCSS and name tokens that do not
resolve — tracked as `harness-intake` issues (elevation, spacing) and fixed
there, not silently on a move. Read the token list as the authority on names.
