# Local Preview Runbook

Use this exact sequence from the repo root to avoid stale bundles/processes.

```bash
cd "/Users/billguo/Desktop/Vibe Coding/PLUS - ONE/plus-vibe-coding-starting-kit"

# 1) Stop any old preview/dev servers on common ports
for p in 8080 4173 5173; do
  lsof -ti tcp:$p | xargs -r kill -9
done

# 2) Build once
npm run build

# 3) Start one preview server
nohup npm run preview:react -- --host 127.0.0.1 --port 8080 --strictPort > /tmp/plus-preview.log 2>&1 &
echo $! > /tmp/plus-preview.pid

# 4) Verify process + listener
cat /tmp/plus-preview.pid
lsof -nP -iTCP:8080 -sTCP:LISTEN

# 5) Verify served bundle hash matches dist
ls dist/assets/index-*.css dist/assets/index-*.js
curl -s http://127.0.0.1:8080 | rg "assets/index-.*\\.(css|js)"
```

