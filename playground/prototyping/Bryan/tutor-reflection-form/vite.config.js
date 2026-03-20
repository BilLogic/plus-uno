import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../..');

export default defineConfig({
    root: __dirname,
    plugins: [react()],
    resolve: {
        alias: {
            '@tutors.plus/design-system': path.resolve(root, 'packages/plus-ds/src/index.js'),
            '@': path.resolve(root, 'packages/plus-ds/src'),
            react: path.resolve(root, 'node_modules/react'),
            'react-dom': path.resolve(root, 'node_modules/react-dom'),
        },
    },
    server: {
        port: 3021,
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
});
