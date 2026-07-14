# Login Specs Structure

Mirror of Figma **Login** canvas (`node-id=1-165`) in Web App Specs.

## Storybook ↔ Figma

| Storybook | Figma |
| --- | --- |
| `Specs/Login/Overview` | Login canvas overview |
| `Specs/Login/Elements/Institution Selection` | Dropdown / Institution Selection (`112:1815`) |
| `Specs/Login/Elements/Institution Form` | Form / Institution Selection (`113:41985`) |
| `Specs/Login/Elements/Access Code Form` | Form / Access Code (`113:38704`) |
| `Specs/Login/Elements/Auth Buttons` | Button / Auths (`113:38903`) |
| `Specs/Login/Elements/Login Buttons` | Button / Misc (`113:38836`) |
| `Specs/Login/Elements/Login Alert` | Alert (`113:41804`) |
| `Specs/Login/Elements/Login Footer` | Footer (`113:38671`) |
| `Specs/Login/Cards/Login Portal` | Cards → Login Portal (`113:42363`) |
| `Specs/Login/Modals/Login Notifications Modal` | Modals → Notifications (`115:4973`) |
| `Specs/Login/Pages/Sign-in Portal` | Pages → Sign-in Portal (`115:5078`) |
| Tables / Sections | Empty / archived in Figma — no docs yet |

## Folder layout

Each organism has its own folder with `{Name}.jsx` (when needed), `{Name}.stories.jsx`, and `{Name}.mdx`.

```
Login/
├── Overview.mdx
├── STRUCTURE.md
├── Elements/
│   ├── InstitutionSelection/
│   ├── InstitutionForm/
│   ├── AccessCodeForm/
│   ├── AuthButtons/
│   ├── LoginButtons/
│   ├── LoginAlert/
│   ├── LoginFooter/
│   └── shared/          # LoginOrDivider + shared SCSS
├── Cards/
│   └── LoginPortal/
├── Modals/
│   └── LoginNotificationsModal/
└── Pages/
    └── SignInPortal/
```

## Elements (Figma)

1. **Dropdown / Institution Selection** — empty · open · typing · filled  
2. **Form / Institution Selection** — official · independent  
3. **Form / Access Code** — default · invalid  
4. **Button / Auths** — Google · Clever  
5. **Button / Misc** — try a demo · back · continue · log in (± disabled)  
6. **Alert**  
7. **Footer**

## Cards

**Login Portal** — `type=official|demo` × `step=1|2|3a|3b`

## Modals

**Notifications** — type A · type B

## Pages

**Sign-in Portal** — full page (logo + portal card + help footer)

## Docs

Each organism has an MDX docs page using `DocsCanvasShell` sections aligned to the Figma frames above.
