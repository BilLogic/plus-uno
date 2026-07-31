import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

/** ESM-safe __dirname so config works when run from project root */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

/**
 * Vite config for the Student Progress prototype.
 * Resolves the design system from the monorepo plus-ds package.
 */
export default defineConfig(({ command }) => ({
    root: __dirname,
    // Deploy Preview base, mirroring post-session-reflection
    base: command === 'build' ? '/prototypes/student-progress/' : '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@tutors.plus/design-system': path.resolve(__dirname, '../../design-system/src/index.js'),
            '@': path.resolve(__dirname, '../../design-system/src'),
            react: path.resolve(__dirname, '../../node_modules/react'),
            'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
        },
    },
    build: {
        outDir: path.resolve(root, 'dist/prototypes/student-progress'),
        emptyOutDir: true,
    },
    server: {
        port: 3050,
        host: true,
        strictPort: false,
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                silenceDeprecations: ['import', 'legacy-js-api'],
            },
        },
    },
}));
