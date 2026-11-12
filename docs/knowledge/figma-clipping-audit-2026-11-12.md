> Status 2026-11-12: read-only scan done. Items on Modal, Form, Popup, Panel and Page docs are **fixed by patterns** (run fig-2195-fix2): skip them. Fixes here wait for the Figma writer.

# Core file clipping audit (read-only), 2026-11-12

Method: scripted bbox scan of every non-Deprecated node on ~125 pages (Foundations, Templates, AI UI, Components, Docs parts, Playground); vector artwork, "focus ring" and "Glow" nodes ignored; duplicates collapsed. Nested ids (I…;…) are instance-internal.
Skipped: Cover, Retired, Archive, Specs draft (not docs), Patterns pages + Form/Panel template pages (empty, 0 children), every node named *deprecated*. Illustrations/Logos: vector art only (many "Updated"/Docs vector overflows, treated as artwork, not listed individually). Specs file never touched.

## Counts (deduped, after dropping focus rings, glows, vectors)
- 1 text past a clipping ancestor: ~22 (3 verified real, ~14 are 2-3px glyph/label nits in "Updated" variant sets)
- 2 fixed-box text too short: 1 (AI sources "Type")
- 3 truncation ENDING on long strings: ~16 (all with maxLines set, look deliberate: placeholders, titles in truncation demos)
- 4 child past clipping parent: ~45 (6 verified real)
- 5 fixed frame, children overflow, no clip: ~14 (mostly overhang demos, focus/close button 6px; 1 verified false positive)

## Verified by screenshot (worst 8)
| # | Page | Node id | Name | What clips | Fix | Verdict |
|---|---|---|---|---|---|---|
| 1 | Page header | I21207:2902;21774:38147;20311:70847;19455:10952;21207:3198 (flagged child ...;21212:1771 Button) | Docs / Do and Don't > Page header | Actions Button 486px past "Actions slot"; title fills row, actions render as empty box at right edge | Wrap title, shrink title (FILL + truncation), or make the Don't example show the overflow intentionally with a label | VERIFIED (may be an intended Don't, confirm) |
| 2 | Calendar | I21151:4430;20311:70902 | Docs / Do and Don't card | Calendar example crops its top (month header and first week) inside the Do card; pair 160px past | Grow Example frame to hug the calendar, or crop from an anchor | VERIFIED |
| 3 | Modal | I19847:45183;19394:48937 (flagged child ...;19847:45341 Fields) | body | Fields list 298px past body, last row cut mid-line ("Session 8") | Grow body / hug, or end list on whole row | VERIFIED |
| 4 | Heading | I21232:528;20313:5902;21233:2516 | Heading specimen (Docs) | Heading text 55px past, shows "Session summ" | Widen specimen frame (hug) or wrap text with fixed width + auto height | VERIFIED |
| 5 | ↳ Vertical button | I21279:1279;20311:70920;20311:70847;19455:10952;21279:1328 | Vertical button (Docs) | Label 35px past, shows "all session" | Hug specimen, or give label wrap/truncation | VERIFIED |
| 6 | Popup select | I21928:1395;20311:70920;20311:70847;19455:10952;21929:3983 | Bar (Docs) | Popup select 90px + Filter button 13px past Bar; menu cut at left/bottom | Grow Bar, align menu inside | VERIFIED |
| 7 | Templates · Overview | I21129:67184;21774:38146;20311:70793;19455:10952;21129:67231 | Frame (Pattern/Templates, 680px past) | Browser mock cropped at bottom, sidebar cut | Likely intentional crop; confirm, else hug | VERIFIED crop, intent unknown |
| 8 | Inline edit | I21259:526;20313:5902;21259:574 | Inline edit (Docs) | Actions 72px below, overhang, not clipped | none | FALSE POSITIVE (intentional popover) |

Worst 5 (real, visible): 21207:3198-chain Page header (I21207:2902;…;21212:1771), I21151:4430;20311:70902 Calendar, I19847:45183;19394:48937 Modal body, I21232:528;20313:5902;21233:2516 Heading, I21279:1279;…;21279:1328 Vertical button.

## Scan-only findings by page
### Foundations
- Elevation 17156:121: I20328:76839;20313:20109;21959:17380 "Blocking · Backdrop" 80px past Plate · Layer stack (clip) — likely demo overhang; body section 4px past Stage x2 (I21949:880;20313:5902;21960:1643 / ;21960:1721). Fix: clip off or grow Stage.
- Grid 6:189: "Glow 1-5" 6-11px past Tile (Updated) — decorative, ignore.
- Border 20246:48414: focus ring 2px past Text field (Docs) — intentional.
- Logos 20246:48416 / Illustrations 19785:489: vector art past Logo Container / Character (artwork); Docs "Body" 3px past Specimen · relationships (I20328:108639…), Vector 10px past Specimen · dot (I20328:108669…). Fix: grow specimen.
- Overview, Tokens, Accessibility, Spacing, Color, Typography, Motion, Iconography, Radius: clean.
### Templates
- Overview 21757:21091: Content 96px past Content area (I19438:3134;19394:1644;21977:3712); 19847:126404 Anatomy · Focused page 32px past Docs / Templates / Anatomy 19858:130896; Pattern/Frame sidebar/Page 200px past (x2, I21577:50678…, I21577:51090…); 21577:51993 Browser frame 33px past X-Large (1440px) 19394:48089; Pattern/Templates 680px past Frame (x6); browser toolbar text (Address, Sidebar, Back, Forward) 85-135px past, toolbar Address field/Trailing 189-202px past (I21764:53414…). Fix: Browser frame toolbar auto-layout fill/hug, or clip off for preview crops.
- Section 21757:21084: _Item 4px past _Tab Item (+29), controls 21551:48753 2px past Tabs row (+5). ↳ Table 21757:21086: _Item 4px (+3).
- Modal 21757:21088: Fields 298px (see #3). ↳ Backdrop 21757:21087: Pattern/Blanket 19444:7996, 19444:8089 32px past Cell · height=hug / fill (+3).
- Popup 21757:21090: Icon 2px; 19393:47608 _Pattern/Menu row 4px past Scrolling menu (+2).
- Frame, Page, ↳ Heading outline, ↳ Card: clean.
### AI UI
- AI color 21740:1274 / AI elevation 21740:1275: "Annotated" 24px past Image (I20444:1675…, I20444:2100…, :2126, :2156, :2180) — annotation overlay overhang. AI voice and tone: AI reply 23px past Example (I20444:1068…). 
- Prompt input 21740:1280: Send 8px past Actions (I20325:64349…); also in AI message, AI sources, AI feedback, AI chat (8px, same cause). Fix in the Send button / Actions component: widen Actions or shrink button.
- AI message 21740:1281: sources 49px past body (I21617:7771;20344:2839;21617:7833;20398:3495). AI sources 21740:1282: 20398:3290 "Type" text 2px past + fixed box h=20 needs ~32 (textAutoResize NONE). AI chat 21740:1284: AI message 28px past PanelBody slot (I20915:69768;20630:59;20915:69844); Crop · AI chat 15px; 21242:10263 AI chat 32px past Crop · AI chat (+9).
- Truncation (maxLines set, look deliberate): About AI UI/Interaction/AI color/AI icon descriptions, Prompt input placeholders.
### Docs parts 20310:1639
- 21956:15797 body section 12px past Kit / Page 21956:15811 (+1); I21956:15926;21956:15797 4px past Kit / Screen (+1). Playground 21757:21092: Content 96px past Content area (I21729:20234;19394:1690;21977:4660) (same Content-area issue as Templates Overview).
### Components
- Calendar 20455:1507: see #2; Docs / Redline 96px past Example (I20886:1849;20313:5902;21155:2883, +1).
- Dropdown menu 3497:19488: 8 variant-label texts 2px past (20065:12270, 20065:12284, 20074:11867, 20074:11885, 20074:11897, 20074:11907, 20062:44) — Updated variant names, nit. Text truncation w=208 chars=26 (Docs).
- Popup select 21927:32: see #6. Select 9094:10266: truncation chars=58 w=270 in Docs (long string, check intended).
- ↳ Tree select 13265:5904: 4x focus-less "Tree select" 8px past Specimen open (I20496:7287…, I20496:8971…): menu overhang, grow Specimen.
- Tag input 18233:47559: "Option menu (overhangs)" 192px past — named overhang, intentional.
- Accordion 13265:5813: Anatomy pin 3/4 31px, 50px past Example (I20951:20360;20313:5902;21212:1939/1942). Fix: grow Example or shift pins.
- Carousel 3497:19498: Neighbor previous/next 384px past Stage 21732:21473 (Updated) — peek, intentional.
- Page header 20455:2827: see #1.
- Panel 20630:44: Panel title truncation chars=45 w=239 (Docs); Panel 20px past Example (I20982:644…, +3).
- Scrollbar 13717:87300: long list 153px past Frame (intentional, demonstrates scroll).
- Pagination 3497:19505: Pagination 92px past Frame (I21227:1240;20311:70920;20311:70847;19455:10952;21227:1905). Fix: grow Frame or wrap. (not screenshotted)
- Flag 3548:245993, Section message 3496:1444: Close button 6px past Dismiss/Expand (Updated). Spotlight 20630:66: Close button 12px past dismissControl (+11).
- Navigation system 17118:120: Thread line 6px; Playground Group · Admin 19px, Group · Toolkit 255px past sections (I21048:2019;19509:73908;21048:2146).
- Inline edit 20455:7667: Actions 40-48px past (Updated variants), Docs 72px (false positive, see #8).
- Static table 17156:122: Anatomy pin 6px (+1). Dynamic table 19685:27042: _Table head cell 97px/88px past (I20095:14438…, I20095:14449…), _Table cell 2px. Tree table 19685:27043: Name truncation w=308 chars=31 (+17), labels 2px.
- Image 19592:514: Specimen 4px past body. Avatar 19592:512: Glyph 3px past Icon (+13). Breadcrumbs: 2px label. Progress bar: _Progress Striped 4px (+423, decorative).
- Status tag 20454:85 / Smart tag 20455:8547: Text truncation chars=40 / 48 (Docs), look deliberate.
- Clean: Button + 8 button siblings (except Vertical button), Checkbox, Comment, Date time picker, Date/Time picker, Fieldset, File upload, Filter menu, Form, Radio x3, Range, Rating, Rich text editor, Cascader, Text area, Text field, Toggle, Avatar group, Icon, Illustration, Logo, Object, Tile, Change/Count/Date/Tag/Tag group, Skeleton, Spinner, Banner, Empty state, Inline message, Modal dialog, Link, Tooltip, Popup, Progress indicator/tracker, Code, Code block, Visually hidden, About AI UI/AI motion etc.

## Notes
- Instance-internal bboxes are noisy: component-level overflows (Close button, Send, Glyph) repeat on many pages; fix once in the component.
- Estimated 2-line text boxes not exhaustive; only 1 NONE-mode text found.

# Layout


Method: per page, scripted walk of every non-Deprecated node (instances not entered). ~110 pages scanned (Foundations 14, Templates 10, Components ~80, AI UI 17, Docs parts, Playground). Skipped: Cover, Retired, Archive, Specs draft, empty pages (Form, Panel template, all Patterns pages: 0 children), anything named *deprecated*. Specs file never touched. Section padding = children bbox vs section (L,T,R,B); target 80 all sides.

## Counts (raw script flags; confidence in the notes below)
| # | Category | Count | Confidence |
|---|---|---|---|
| 1 | Frame with 2+ related children, layoutMode NONE | ~19 | medium (Screen / Labeled instance / Construction guides may be deliberate canvases) |
| 2 | FIXED container with slack >16px that should HUG/FILL | ~1,215 | low-medium: ~90% are Row label / Label cell / Column label cells in variant matrices (fixed label columns) |
| 3 | Top-level Sections / zones not content+80 | ~44 sections + ~9 page-docs frames FIXED/HUG | high for overflow, medium for slack |
|   | of which section overflowed by content (bottom/right negative) | 27 | high (3 screenshot-verified, 1 measured) |
|   | of which slack-only (extra space, not hugging) | 17 | high |
| 4 | Auto-layout gap/padding not bound to a spacing variable | ~1,990 containers | high (boundVariables.itemSpacing/padding* missing). Biggest: Color 184, Nav system 113, Illustrations 76, Avatar 72, Tile 60, Spacing 55 |
| 5 | Hand-built docs blocks (FRAME, not instance) | ~155 | Color "Chip" 130 = medium; rest medium-low (see notes) |
| 6 | Overlapping siblings in non-auto-layout parents | 10 | medium |

## Page-level findings (grouped by page)

### Templates
| Page | Node | Name | What is wrong | Fix | Conf |
|---|---|---|---|---|---|
| ↳ Table 21757:21086 | 19448:11010 | Docs (section) | content 1,841px past section bottom (section h≈4,283 vs Docs frame ≈6,124); bg ends mid-content | resize section to hug (content+80) | high, VERIFIED shot |
| Popup 21757:21090 | 19448:11018 / 19448:11019 | Components / Docs | bottom -156 / -106: content past section | hug | high |
| ↳ Card 21757:21085 | 19448:11007 / 19448:11006 | Docs / Components | bottom -122 / left col pad 76 | hug | high |
| Section 21757:21084 | 19448:11004 | Docs | bottom 120 (40 extra) | hug | high |
| Overview 21757:21091 | 19438:3133 | Labeled instance | Pattern/Templates overlaps Pin 1 (10x10) and Redline 1 (231x8); abs layout 5 kids | intentional anatomy overlay? confirm; else Pin/Redline absolute-in-autolayout | medium |
| Overview | 21378:52591 / :52592 | Row · 0 / Row · 1 | FIXED/FIXED, 1,124px slack (matrix rows) | HUG vertical | medium |
| Backdrop 21757:21087 | 19438:3016 | Labeled instance | abs 5 kids, Marker overlap 10x10 | same as above | medium |
| Popup | 19438:3089 | Labeled instance | abs 10 kids, Marker overlap | same | medium |
| Modal 21757:21088 | 21726:18543, 21726:18620 + 7 more | Screen | layoutMode NONE with 2 kids (9 frames) | auto-layout or intentional absolute screen mock; confirm | medium |
| Frame 21757:21081 | 21979:2917.. | Column label / Row label | FIXED/FIXED with 1,314/434px slack | HUG | low |
| Frame | 19422:2971 | Docs / Frame | FIXED/HUG pad 24,32,24,32 (not 80) | confirm page-column width intent | low |
| all template pages | 21757:37372, 37358-37449 | Components zone / Components | gap 80 / pad 40 unbound; gap 40 unbound | bind to spacing vars | high |
| Page, Section, Card, Table, Modal, Backdrop, Popup | Docs / X / Anatomy, Anatomy / Labeled | FRAME not instance (2–8 per page) | detached anatomy blocks, no mainComponent | replace with Docs parts Anatomy instance | medium |
| Section | 21379:52579, 19394:48764 | _Section header / Variant matrix | frame, not instance | Docs parts section header instance | medium |
| Playground 21757:21092 | 21729:21126, 21729:22247 | Screen | NONE layout, 2 kids | confirm | medium |

### Docs parts 20310:1639
| Node | Name | What is wrong | Fix | Conf |
|---|---|---|---|---|
| 20310:30672 | Docs (section) | bottom slack 1,325 (not hugging) | hug | high |
| 20310:1677 | Components | Docs / Do and Don't (21774:38182) overlaps Docs / Hero (20313:20127) 732x464; Docs / Example (20311:67720) overlaps _Docs / Related card (20325:60474) 296x12 | separate or auto-layout the stack | medium |
| 20311:70960 | Docs template / Component | FIXED/HUG pad 32 all sides | template reference; fine if 1472 column is spec | low |
| 20311:71375 / 71379 | Rule 1 / Rule 2 | gap 12 unbound | bind | high |

### Components: section overflow (content past section) — high confidence
| Page | Section node | pad L,T,R,B |
|---|---|---|
| Filter menu 21927:33 | 21932:417 Docs | 80,80,80,-1646 — VERIFIED shot (section 2,248 tall, Docs frame 3,814) |
| Popup select 21927:32 | 21928:1375 Docs | 80,80,80,-988 — VERIFIED shot |
| Select 9094:10266 | 20276:49033 Docs / 20276:49032 Updated | -490 bottom / right -110, bottom 244 — measured, shot inconclusive |
| Dropdown menu 3497:19488 | 20276:27626 Docs / 20276:27625 Updated | -264 bottom; Updated: Components x Parts overlap 900x100 — VERIFIED shot |
| ↳ Icon button 20299:5105 | 20299:5108 Docs | -264 |
| Checkbox 3497:19493 | 20275:367 Docs / 20275:366 Updated | -152 / bottom 67, Components x Parts overlap 640x15 |
| Radio 14876:12005, Toggle 14876:12006 | 20276:31272, 20276:55419 Docs | -152 each |
| Tooltip 3497:19486 | 20277:30 Docs | -56 (also Docs / Page header hand-built 20277:35) |
| ↳ Date picker, Date time picker, Button, Radio group, Choice grid, Rich text editor, Text area, Text field, Tag input | 20276:9773, 20276:16101, 20262:4324, 20276:30055, 20276:4286, 20276:34028, 20276:54419, 20276:55311, 20276:53852 Docs | -35 to -40 each |
| Image 19592:514 | 19593:559 Playground | right -112 |
| AI message 21740:1281 | 20343:1975 Docs | -12 |

### Components: sections with slack only (not hugging) — high
Status tag 20454:101 Updated (bottom 120); Tag 20454:1340 Updated (120), 20454:1355 Docs (64); Tag group 20454:1810 Docs (170); Popup 20276:120455 Docs (218); Spinner 20455:86 Updated (112/152); Icon 19595:47 / 19596:186 (20/16); Navigation system 20276:118880 Docs (16); Spotlight 20630:69 Docs (74); AI elevation 20292:3750 Docs (28); AI feedback 20398:2964 Components (0 bottom); Checkbox Updated 67.

### Components / AI: zone frames FIXED width, HUG height (not full hug) — medium
Button group 19956:140193, Close button 20310:26965 (pad 64); Radio group 20009:73126, Choice grid 20009:70624, Range 20003:1560, Rating 20003:2843, Tooltip 20643:315, Scrollbar 20095:7544, Section message 20095:8366 (pad 40); Time picker 21461:2147 (pad 0); AI icon 20303:71149, Generative border 20303:80995, Prompt input 20324:90001, AI message 20343:2004, AI sources 20398:2749, AI feedback 20398:3041 (Playground / ..., pad 24). Padding 24/32/40/64, none is 80.

### Hand-built / detached docs blocks — medium
- Color 3:36: 130 FRAMEs named "Chip" (e.g. 20252:1471, :1475, :1479, :1483), token chips built by hand, FIXED/FIXED with 67x16 slack. Fix: Docs parts token chip instance.
- Page header 20455:2827: 20622:89 "Page header frame", 20955:1786 "Docs / Page header" (FIXED/HUG pad 32), 21207:2824 "Token redlines" — non-instances.
- Tooltip 20277:35 "Docs / Page header" FRAME, Banner 20455:3267: 20645:199 "Banner", 20737:142 "Docs / Banner" (these may be the component docs themselves, not docs parts: low).
- Logos 20246:48416: 20282:73605 "Banner · PLUS brand" (NONE layout, 7 kids).
- All Foundations and Components pages: "Part / Anatomy" and "Part / Do and don’t" are plain FRAMEs (not instances) on ~100 pages (e.g. 20330:46706, 20328:88686, 20328:88760). If Docs parts defines these as components, they are detached; if they are template skeleton frames this is fine. Needs Bill's answer. Low.

### Overlaps (6)
Docs parts (2 above); Templates Overview/Backdrop/Popup labeled instances (3, overlay pins: likely intentional); Checkbox, Dropdown menu Updated (Components x Parts, real, VERIFIED Dropdown); Image 19593:557 Figure / Variant matrix x Docs / Section header 320x24; Tile 19593:673 Variant matrix x Docs / Section header 320x20 (section header sits over matrix; real, not screenshotted).

### Per-page counts: unbound gap/padding and FIXED slack (examples)
Raw counts, one example each. Pattern: "Row labels" / "Column labels" / "Matrix body" / "Components" / "Token grid" / "Docs / X" frames use raw gap 8/16/24/40/80 and pad 24/32/40/80.

| Page | unb | fix | ex unbound | ex fixed |
|---|---|---|---|---|
| Color | 184 | 81 | 20252:1464 Color / Token grid gap40 pad32 | 20252:1471 Chip |
| Navigation system | 113 | 37 | 21410:4656 Column labels | 21410:4657 |
| Illustrations | 76 | 71 | 21403:12345 Label · character | same |
| Avatar | 72 | 36 | 20655:1380 | 21448:1997 |
| Tile | 60 | 16 | 21466:1625 | 21467:890 |
| Spacing | 55 | 0 | 20252:1741 | — |
| Typography | 50 | 0 | 20262:299 | — |
| Icon (comp) | 50 | 2 | 20659:1014 | 19597:109 |
| Tokens | 38 | 0 | 20259:28 | — |
| Radius | 36 | 6 | 20258:44 | 20258:100 |
| Static table | 26 | 158 | 21381:7890 | 21381:7886 |
| Tabs | 31 | 56 | 20095:11828 | 21650:2067 |
| Dropdown menu | 12 | 56 | 20065:12268 | 20065:12269 |
| Tree table | 10 | 54 | 20110:760 | 21405:8048 |
| ↳ Icon button | 2 | 48 | 21508:1210 | 21508:1229 |
| Other pages | 1–35 each | 0–37 | see sections above | |
Clean (no flags in any category): Panel 20630:44, AI button 21740:1279.

## Screenshots (verified)
1. 19448:11010 Table template Docs: grey section ends mid-page, content continues.
2. 21932:417 Filter menu Docs: grey ends before "Do and don't"; section 2,248 vs child 3,814 (measured).
3. 21928:1375 Popup select Docs: grey ends before do/don't pairs.
4. 20276:27625 Dropdown menu Updated: Components block runs into Parts.
5. 20276:49033 Select Docs: measured -490, screenshot shows full content inside bounds (cannot confirm visually; trust measurement).

## Notes
- Matrix label cells (Row label, Label cell, Column label) are fixed by design in most variant matrices; treat category 2 as a tidy-up list, not a defect list.
- Foundations pages (Overview, Accessibility, Motion, Typography, Spacing, Grid, Color, Elevation, Border, Radius) have no section-level layout defects beyond unbound spacing and Chip/Part hand-built frames.
- Section padding check only measured SECTION nodes and top-2-level zone frames; deeper nesting not audited.
