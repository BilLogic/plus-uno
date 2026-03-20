import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        port: 3030,
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
