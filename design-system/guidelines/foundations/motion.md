---
summary: Duration, easing, patterns and reduced motion
---

<!-- Tier: 2 -->

# Motion

Motion has three attributes, duration, easing and property, tuned for a calm tutoring product.

## Rules

- **Tokens are numeric** (`Motion/duration-150`, `Motion/easing-out-practical`), with bundles only for Modal, Blanket, Drawer, Popup, Flag, Tooltip, Tab and Button. Bootstrap's motion variables are overridden by them.
- **Interactions run 50 to 150 ms, transitions 150 to 400.** Buttons hover and press in 100 ms. Frequent things stay under 150.
- **Exits are shorter than entrances:** modal, drawer and flag leave in 150 ms.
- **Easing:** enter out, exit in, reposition in place in and out. The expressive curve is for non-task moments only; everywhere else use out-bold.
- **1000 ms is for character moments only** (empty state, completion, onboarding, error), once per view, never in a task flow. Chart and card intros are capped at 600.
- **The first-load reveal** plays once per session in 400 ms or less, never on in-app navigation.
- A tooltip hides 100 ms after the pointer leaves. Every Spinner runs one 1000 ms period.
- A narrow-width sidebar, if one is specified, takes the Drawer tokens.
- Accordion and Progress animate size and are documented exceptions.
- Prefer transform and opacity to width, height and top.
- **Reduced motion:** motion is off and instant. Set every duration and stagger to 0 ms under `prefers-reduced-motion`; a Spinner becomes a static icon with the word Loading; charts draw their final state; characters rest. Nothing is communicated by motion alone.
