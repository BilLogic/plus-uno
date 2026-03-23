# Training Onboarding — Wireframe Prototype

**Location:** `Playground/Ashley/Training Onboarding` in Storybook  
**Type:** Low-fidelity structural wireframe (Consulting Mode output)  
**Status:** 🔲 Wireframe — not for production

---

## Page Goal

> **"Guide new PLUS tutors from zero to first session — one step at a time."**

---

## Files

| File | Description |
|---|---|
| `TrainingOnboardingPage.jsx` | Main wireframe component |
| `TrainingOnboardingPage.scss` | Wireframe-level structural styles only |
| `TrainingOnboardingPage.stories.jsx` | 5 Storybook stories across key states |

---

## Storybook Stories

| Story | State |
|---|---|
| 📋 Docs | Consulting brief summary + UX principles |
| 🔲 Wireframe — Mid Onboarding | Default (step 2 in-progress) |
| 🆕 Fresh Start — Day 1 | All steps locked, step 1 in-progress |
| 🏁 Near Complete — Step 5 | Steps 1–4 done, step 5 active |
| ✅ All Done | Onboarding complete, no CTA shown |

---

## Layout (4 Structural Blocks)

```
┌──────────────────────────────────────────────────────────────┐
│  SECTION 1 — Welcome Header                                  │
│  "Welcome, [Name]. Let's get you ready to tutor."            │
│   Progress: ●●●○○  Step 3 of 5 · 60% complete               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  SECTION 2 — Next Step CTA (primary, above fold)             │
│  📍 YOUR NEXT STEP                                           │
│  [Module Title]           [ ▶ Continue Module ]  ← PRIMARY   │
│  [1-line description]                                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  SECTION 3 — Onboarding Path (required, sequential)          │
│  1  ✓  Welcome to PLUS            [Complete]                 │
│  2  ●  Your Role at PLUS          [In Progress]  ← current  │
│  3  ○  Tutoring Session Overview  [Locked]                   │
│  4  ○  Student Communication      [Locked]                   │
│  5  ○  Session Wrap-Up            [Locked]                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  SECTION 4 — Supplemental Resources (collapsed)              │
│  [▼ Show Supplemental Resources]                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 3 UX Principles

**P1 — Progress Visibility Reduces Anxiety**  
A persistent progress bar validates effort and creates forward momentum.

**P2 — One Decision at a Time**  
The next action is always singular and obvious. No carousel. No library browsing at onboarding stage.

**P3 — Structure Before Content**  
Experience feels like a guided path, not a content library.

---

## What Was Removed from Original Page

- ❌ Featured Modules carousel (choice paralysis)
- ❌ All Modules table (overwhelming as default view)
- ❌ Sorting / filtering controls
- ❌ Unrestricted browsing before onboarding is complete

---

## Next Steps (Post-Wireframe)

1. Validate structure with team
2. Map to Figma design tokens
3. Swap wireframe components for design system components
4. Define locked/unlock logic in data layer
5. Add animation for step completion
