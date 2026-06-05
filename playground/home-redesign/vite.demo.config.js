import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

/** ESM-safe __dirname so config works when run from project root */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Demo Recording Vite config.
 *
 * Same resolve/css setup as the home-redesign prototype, but serves `demo.html`
 * as the SPA entry. Because the demo uses BrowserRouter, a refresh on a deep
 * route (e.g. /admin) would otherwise 404 / fall back to index.html — the
 * middleware below rewrites navigation requests to /demo.html so refreshes and
 * deep links stay inside the demo app.
 */
const demoFallback = () => ({
    name: 'demo-html-spa-fallback',
    configureServer(server) {
        server.middlewares.use((req, _res, next) => {
            const url = (req.url || '').split('?')[0];
            const isNavigation = req.method === 'GET'
                && (req.headers.accept || '').includes('text/html');
            // Leave real files (with an extension) and Vite internals alone.
            const looksLikeFile = /\.[a-zA-Z0-9]+$/.test(url);
            const isViteInternal = url.startsWith('/@') || url.startsWith('/node_modules') || url.startsWith('/src');
            if (isNavigation && !looksLikeFile && !isViteInternal) {
                req.url = '/demo.html';
            }
            next();
        });
    },
});

export default defineConfig({
    root: __dirname,
    plugins: [react(), demoFallback()],
    resolve: {
        alias: {
            '@tutors.plus/design-system': path.resolve(__dirname, '../../design-system/src/index.js'),
            '@': path.resolve(__dirname, '../../design-system/src'),
            react: path.resolve(__dirname, '../../node_modules/react'),
            'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
        },
    },
    server: {
        port: 3011,
        host: true,
        strictPort: true,
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                silenceDeprecations: ['import', 'legacy-js-api']
            }
        }
    }
});
