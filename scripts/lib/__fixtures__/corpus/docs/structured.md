---
name: uno-fixture
trigger_types:
  - github_cron            # the comment on the item
  - github_dispatch        # wrapped over
                           # two lines
references_when:
  isNewComponent: references/new-component-scaffolding.md
model_default: claude-sonnet-4-6
---

# Structured

A list and a mapping, the two shapes the Actions loader dispatches on.
