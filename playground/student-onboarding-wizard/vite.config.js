import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@plus-ds': path.resolve(__dirname, '../../../../design-system/src'),
            '@': path.resolve(__dirname, '../../../../design-system/src')
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                includePaths: [path.resolve(__dirname, '../../../../design-system/src')],
            },
        },
    },
    server: {
        port: 3000,
    }
});
