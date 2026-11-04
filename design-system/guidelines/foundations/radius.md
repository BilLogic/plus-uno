---
summary: Corner radius: height ÷ 4 for controls, 6 and 4 for buttons, and container tokens
---

<!-- Tier: 2 -->

# Radius

## Rules

- **Controls round at a quarter of their height.** A 24 high control takes 6, a 32 high one 8, a 40 high one 10 (`--radius-h24`, `--radius-lg`, `--radius-h32`).
- **Buttons are the exception:** 6 default and 4 compact, with rings at 8 and 6. This covers Button, Icon button, Link button, Split button, Filter button, Close button and Vertical button.
- **Containers own their tokens:** Card and Page 16, Modal and Popup 12, Table 8, Menu 10 to 14 by row height, Tooltip 6, Tile 25% of its size.
- **A focus ring is the control's radius + 2.** Containers draw none.
- **Nested corners:** an inner shape rounds at the container's radius minus the padding.
- **Flush parts are clipped, not rounded.** A part keeps its own component's radius wherever it sits.
- Components bind the semantic token, never a primitive (`--radius-*`).
- Radius never signals state or meaning alone.
