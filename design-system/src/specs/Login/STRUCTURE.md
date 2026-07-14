# Login Specs Structure

Mirror of Figma **Login** canvas (`node-id=1-165`) in Web App Specs.

## Storybook ↔ Figma

| Storybook | Figma |
| --- | --- |
| `Specs/Login/Overview` | Login canvas overview |
| `Specs/Login/Elements` | Components → Elements (`112:1200`) |
| `Specs/Login/Cards` | Components → Cards → Login Portal (`113:42363`) |
| `Specs/Login/Modals` | Components → Modals → Notifications (`115:4973`) |
| `Specs/Login/Pages` | Components → Pages → Sign-in Portal (`115:5078`) |
| Tables / Sections | Empty / archived in Figma — no docs yet |

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

Each category has an MDX docs page (`Elements.mdx`, `Cards.mdx`, `Modals.mdx`, `Pages.mdx`)
using `DocsCanvasShell` sections aligned to the Figma frames above.
