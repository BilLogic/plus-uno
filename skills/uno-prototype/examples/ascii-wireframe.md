<!-- GOLDEN EXAMPLE — ASCII wireframe house style (in-chat WIP artifact,
     references/deliverables/wireframe.md Route A). Subject: seed-1's
     shout-outs board. Conventions: box-drawing chars · one screen per block ·
     [button] (radio) ▸link annotations · every screen and state named. -->

# ASCII wireframe — Tutor shout-outs board

## Screen: Board (tutor view, populated)

```
┌──────────────────────────────────────────────┐
│  Shout-outs                    [Give one ✦]  │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ To: Ms. Alvarez        from Jamie · 2d │  │
│  │ "Explained fractions three ways until  │  │
│  │  it clicked. Legend."                  │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ To: Mr. Okafor          from staff · 5d│  │
│  │ "Covered two extra shifts this week."  │  │
│  └────────────────────────────────────────┘  │
│                ▸ load older                  │
└──────────────────────────────────────────────┘
```

## Screen: Board (tutor view, empty state)

```
┌──────────────────────────────────────────────┐
│  Shout-outs                    [Give one ✦]  │
├──────────────────────────────────────────────┤
│                                              │
│        No shout-outs here yet.               │
│        Know a great tutor? [Give one ✦]      │
│                                              │
└──────────────────────────────────────────────┘
```

## Screen: Compose

```
┌──────────────────────────────────────────────┐
│  ← back            Give a shout-out          │
├──────────────────────────────────────────────┤
│  Tutor:   [ search by name…        ▾ ]       │
│  Message: ┌──────────────────────────────┐   │
│           │                              │   │
│           └──────────────────────────────┘   │
│                                              │
│              [Post shout-out]                │
└──────────────────────────────────────────────┘
```

Notes for iteration: composing is modal vs full-screen → designer call;
moderation/report affordance deliberately absent (won't-include — open
question filed, not invented).
