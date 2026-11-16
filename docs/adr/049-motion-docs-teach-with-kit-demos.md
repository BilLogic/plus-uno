---
embodiment: ide
summary: Motion foundation pages teach with kit MotionDemo figures; real-component motion stories stay in place as play tests and component-page product examples.
status: active
verified: 2026-11-16
---

# ADR-049: Motion docs teach with kit demos; real components are tests and examples (2026-11-16)

**Decision.** Motion foundation pages under `design-system/src/styles/` teach rules with kit `MotionDemo` figures (for example, `design-system/src/styles/MotionTransitions.stories.jsx`), which loop automatically on the docs page with paths drawn before the motion, a dashed landing ghost, a speed control and a reduced still. Real-component motion stories stay in their component and template story files as automated `play` tests and interactive product examples on component pages. A sound figure that requires a press because browsers block audio without a user gesture (such as `FlagStories.LandsWithNotify` on `design-system/src/styles/SoundWithMotion.mdx`) may remain embedded where sound is the subject.

**Why.** Storybook's docs `Canvas` mounts a story's `render` output without running its `play` function. On `design-system/src/styles/MotionTransitions.mdx`, 20 real-component motion figures sat motionless unless a reader knew what to click, while 21 kit `MotionDemo` stories already authored in `design-system/src/styles/MotionTransitions.stories.jsx` were embedded nowhere.

**Consequences.** Every transition card on `design-system/src/styles/MotionTransitions.mdx` embeds its `TransitionStories` kit demo and moves at 1× on load; cards with no kit demo drop the dead real-component `Canvas` and point to the component page instead. Real-component motion stories are preserved in their story files so `check:storybook` continues to assert component spring behavior and component pages retain live product examples. `docs/conventions/design-system-glossary.md` defines **Motion demo** to separate kit teaching figures from real-component product examples.

**What would reopen it.** If Storybook adds isolated per-canvas autoplay that does not steal focus or trigger unintended sound, real-component stories still belong on component pages rather than replacing kit teaching demos on foundation pages unless the kit shapes cannot express a transition rule.

— Bill, Nov 2026, deciding option A in #2660; recorded by Gemini 4 Carbon from the motion illustration audit.
