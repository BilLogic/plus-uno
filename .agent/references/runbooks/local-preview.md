# Local Preview Runbook

Use this flow from repo root to verify a production-like preview.

```bash
cd "/Users/billguo/Desktop/Vibe Coding/PLUS - ONE/plus-vibe-coding-starting-kit"

# 1) Build the app
npm run build

# 2) Start preview server on a fixed port
npm run preview:react -- --host 127.0.0.1 --port 8080 --strictPort

# 3) Verify app serves from dist output
curl -s http://127.0.0.1:8080 | rg "assets/index-.*\\.(css|js)"
ls dist/assets/index-*.css dist/assets/index-*.js
```

## Optional Storybook Preview

```bash
npm run storybook
```

Then open `http://127.0.0.1:6006`.
