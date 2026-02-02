import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

/** ESM-safe __dirname so config works when run from project root */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite config for Application Prototype (homepage/admin variant from Figma APPLICATION-PROTOTYPES node 158-21725).
 * Resolves design system from monorepo plus-ds package.
 */
export default defineConfig({
    root: __dirname,
    plugins: [react()],
    resolve: {
        alias: {
            '@tutors.plus/design-system': path.resolve(__dirname, '../../../../packages/plus-ds/src/index.js'),
            '@': path.resolve(__dirname, '../../../../packages/plus-ds/src'),
            react: path.resolve(__dirname, '../../../../node_modules/react'),
            'react-dom': path.resolve(__dirname, '../../../../node_modules/react-dom'),
        },
    },
    server: {
        port: 3011,
        host: true,
        strictPort: false,
    },
});
