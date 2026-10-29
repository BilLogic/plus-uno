import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

/** ESM-safe __dirname so config works when run from project root */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite config for the AI compliance dashboard prototype.
 * Resolves design system from monorepo plus-ds package.
 * Deploy Preview base: /prototypes/compliance-dashboard/
 */
export default defineConfig(({ command }) => ({
    root: __dirname,
    base: command === 'build' ? '/prototypes/compliance-dashboard/' : '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@tutors.plus/design-system': path.resolve(__dirname, '../../design-system/src/index.js'),
            '@': path.resolve(__dirname, '../../design-system/src'),
            react: path.resolve(__dirname, '../../node_modules/react'),
            'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
        },
    },
    server: {
        port: 3031,
        host: true,
        strictPort: false,
    },
    build: {
        outDir: path.resolve(__dirname, '../../dist/prototypes/compliance-dashboard'),
        emptyOutDir: true,
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                silenceDeprecations: ['import', 'legacy-js-api']
            }
        }
    }
}));
