import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

/** ESM-safe __dirname so config works when run from project root */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

/**
 * Demo Recording Vite config.
 *
 * - Dev (`npm run dev:demo`): served at the root so `/demo.html` works, with a
 *   middleware fallback so BrowserRouter deep links stay on the demo file.
 * - Build (`npm run build:demo`): emitted into the marketplace's `dist/demo/`
 *   as a self-contained sub-app (base `/demo/`), so the deployed marketplace can
 *   link to `/demo/demo.html`. Built after the root app so it isn't wiped.
 */
const demoFallback = () => ({
    name: 'demo-html-spa-fallback',
    configureServer(server) {
        server.middlewares.use((req, _res, next) => {
            const url = (req.url || '').split('?')[0];
            const isNavigation = req.method === 'GET'
                && (req.headers.accept || '').includes('text/html');
            const looksLikeFile = /\.[a-zA-Z0-9]+$/.test(url);
            const isViteInternal = url.startsWith('/@') || url.startsWith('/node_modules') || url.startsWith('/src');
            if (isNavigation && !looksLikeFile && !isViteInternal) {
                req.url = '/demo.html';
            }
            next();
        });
    },
});

export default defineConfig(({ command }) => ({
    root: __dirname,
    base: command === 'build' ? '/demo/' : '/',
    plugins: [react(), demoFallback()],
    resolve: {
        alias: {
            '@tutors.plus/design-system': path.resolve(repoRoot, 'design-system/src/index.js'),
            '@': path.resolve(repoRoot, 'design-system/src'),
            '@plus-ds': path.resolve(repoRoot, 'design-system/src'),
            react: path.resolve(repoRoot, 'node_modules/react'),
            'react-dom': path.resolve(repoRoot, 'node_modules/react-dom'),
        },
        dedupe: ['react', 'react-dom', 'framer-motion'],
    },
    server: {
        port: 3011,
        host: true,
        strictPort: true,
    },
    build: {
        outDir: path.resolve(repoRoot, 'dist/demo'),
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
            input: path.resolve(__dirname, 'demo.html'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                loadPaths: [
                    path.resolve(repoRoot, 'design-system/src/tokens'),
                    path.resolve(repoRoot, 'design-system/src/styles'),
                    path.resolve(repoRoot, 'design-system/src/forms'),
                ],
                silenceDeprecations: ['import', 'legacy-js-api'],
            },
        },
    },
}));
