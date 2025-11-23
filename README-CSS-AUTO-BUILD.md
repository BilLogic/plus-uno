# Automatic CSS Rebuild

CSS is now set to automatically rebuild when SCSS files change.

## Available Commands

### Watch CSS (Automatic Rebuild)
```bash
npm run watch:css
```
This will watch for changes to any SCSS files and automatically rebuild `dist/css/main.css` when changes are detected.

### Build CSS Once
```bash
npm run build:css
```
This builds CSS once without watching for changes.

### Auto Watch Script
```bash
npm run watch:css:auto
```
This runs an enhanced watch script that builds CSS once initially, then watches for changes.

## How It Works

The watch process monitors:
- `src/css/main.scss` (main stylesheet)
- All imported SCSS files in:
  - `design-system/tokens/` (token files)
  - `design-system/components/` (component styles)

When any SCSS file changes, the CSS is automatically rebuilt to `dist/css/main.css`.

## Usage

1. **Start watching**: Run `npm run watch:css` in your terminal
2. **Edit SCSS files**: Make changes to any SCSS file
3. **Auto-rebuild**: CSS will automatically rebuild when you save

## Note

The watch process runs in the background. To stop it, press `Ctrl+C` in the terminal where it's running.

