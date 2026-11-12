#!/usr/bin/env bash
#
# scaffold-prototype.sh — write a new prototype under prototypes/<slug>: a Vite
# app on the design-system aliases, a page in the default template, and the next free dev
# port, picked automatically.
#
# Usage:
#   bash skills/uno-prototype/scripts/scaffold-prototype.sh <slug>
#
# The slug must be kebab-case: ^[a-z0-9][a-z0-9-]{1,40}$
# Port collisions were a manual step ("pick an unused port — check other
# prototypes configs"); this script makes it deterministic.

set -euo pipefail

slug="${1:-}"
if [[ -z "$slug" ]]; then
  echo "usage: $0 <slug>" >&2
  exit 1
fi
if [[ ! "$slug" =~ ^[a-z0-9][a-z0-9-]{1,40}$ ]]; then
  echo "[fail] slug must be kebab-case (^[a-z0-9][a-z0-9-]{1,40}\$): $slug" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
dest="$repo_root/prototypes/$slug"

[[ -e "$dest" ]] && { echo "[fail] already exists: $dest" >&2; exit 1; }

# Next free port: max port used by any prototype vite config, plus one.
max_port=$(grep -rhoE 'port: *[0-9]+' "$repo_root"/prototypes/*/vite.config.js 2>/dev/null \
  | grep -oE '[0-9]+' | sort -n | tail -1)
port=$(( ${max_port:-3000} + 1 ))

mkdir -p "$dest/src"

cat > "$dest/vite.config.js" <<EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

/** The $slug prototype, on the design system's aliases. */
export default defineConfig({
    root: __dirname,
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(root, 'design-system/src'),
            react: path.resolve(root, 'node_modules/react'),
            'react-dom': path.resolve(root, 'node_modules/react-dom'),
        },
    },
    server: { port: $port, host: true, strictPort: false },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                silenceDeprecations: ['import', 'legacy-js-api'],
                loadPaths: [
                    path.resolve(root, 'design-system/src/tokens'),
                    path.resolve(root, 'design-system/src/styles'),
                ],
            },
        },
    },
});
EOF

cat > "$dest/index.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>$slug – PLUS</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400..700&family=Noto+Serif:wght@500..600&family=Noto+Sans+Mono:wght@400..500&display=swap" rel="stylesheet">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOF

cat > "$dest/src/main.jsx" <<'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/styles/main.scss';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
EOF

cat > "$dest/src/index.css" <<'EOF'
/* The Frame fills its box: give it the whole window. */
html, body, #root { height: 100%; }
body { margin: 0; background: var(--ds-surface-sunken); }
EOF

cat > "$dest/src/App.jsx" <<'EOF'
import React from 'react';
import { Breadcrumb, Sidebar } from '@/components';
import { Frame, PatternSection } from '@/patterns';

/** The prototype's first page, on the default template. Build against the confirmed plan. */
const App = () => (
    <Frame
        header={<Breadcrumb items={[{ text: 'Home' }]} />}
        sidebar={<Sidebar user="tutor" activeTabId="home" account={{ id: 'ana', name: 'Ana Ruiz', role: 'Tutor' }} />}
    >
        <PatternSection level="page" title="Home" description="Start here." />
    </Frame>
);

export default App;
EOF

echo "[ok] scaffolded prototypes/$slug (dev port $port)"
echo "     run:  npx vite --config prototypes/$slug/vite.config.js"
echo "     next: edit $dest/src/App.jsx — build against the confirmed plan"
