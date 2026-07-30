import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

/** ESM-safe __dirname so config works when run from project root */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

/**
 * Vite config for the post-session reflection prototype.
 * Deploy Preview base: /prototypes/post-session-reflection/
 */
export default defineConfig(({ command }) => ({
    root: __dirname,
    base: command === 'build' ? '/prototypes/post-session-reflection/' : '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@tutors.plus/design-system': path.resolve(root, 'design-system/src/index.js'),
            '@': path.resolve(root, 'design-system/src'),
            react: path.resolve(root, 'node_modules/react'),
            'react-dom': path.resolve(root, 'node_modules/react-dom'),
        },
    },
    server: {
        port: 3009,
        host: true,
        strictPort: false,
    },
    build: {
        outDir: path.resolve(root, 'dist/prototypes/post-session-reflection'),
        emptyOutDir: true,
    },
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
}));
