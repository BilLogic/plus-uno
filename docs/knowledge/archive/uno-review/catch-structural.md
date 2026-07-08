<!-- Load for: detecting structural code issues — missing key props, FA Pro icons -->

# Catch Patterns: Structural

Grep patterns for detecting structural code issues in PLUS projects.

## Missing key prop in .map()
```bash
grep -rn '\.map(' --include="*.jsx" -A 3 <dir> | grep -B 1 '<' | grep -v 'key='
```
Every element returned from `.map()` needs a unique `key` prop.

## Font Awesome Pro icons (forbidden)
```bash
grep -rn 'fa-light\|fa-thin\|fa-sharp\|fa-duotone' --include="*.jsx" --include="*.html" <dir>
```
Only FA Free tiers allowed: `fa-solid`, `fa-regular`, `fa-brands`.
