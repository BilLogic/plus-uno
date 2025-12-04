# Foundation: Icons

**Context**: Font Awesome icon sizing tokens.
**Layer**: Foundation

## 1. Icon Sizing Principles
*   **Match Typography**: Icons should always match the text size they accompany.
*   **Use Semantic Tokens**: Use `var(--font-size-fa-*)` tokens.

## 2. Headline Icons (Solid)
| Class | Size Token | Size |
| :--- | :--- | :--- |
| `.h1` | `var(--font-size-fa-h1-solid)` | 36px |
| `.h2` | `var(--font-size-fa-h2-solid)` | 28px |
| `.h3` | `var(--font-size-fa-h3-solid)` | 24px |
| `.h4` | `var(--font-size-fa-h4-solid)` | 20px |
| `.h5` | `var(--font-size-fa-h5-solid)` | 16px |
| `.h6` | `var(--font-size-fa-h6-solid)` | 14px |

## 3. Body Icons (Solid)
| Class | Size Token | Size |
| :--- | :--- | :--- |
| `.body1-txt` | `var(--font-size-fa-body1-solid)` | 14px |
| `.body2-txt` | `var(--font-size-fa-body2-solid)` | 12px |
| `.body3-txt` | `var(--font-size-fa-body3-solid)` | 10px |

## 4. Usage Example
```html
<h1 class="h1">
    <i class="fas fa-check"></i> <!-- Automatically sized -->
    Heading Text
</h1>
```
