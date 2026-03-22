import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Repo root: four levels up from playground/prototyping/bill/monthly-report
const root = path.resolve(__dirname, '../../../..');

export default defineConfig({
    plugins: [react()],
    root: __dirname,
    resolve: {
        alias: {
            '@': path.resolve(root, 'design-system/src'),
            'react': path.resolve(root, 'node_modules/react'),
            'react-dom': path.resolve(root, 'node_modules/react-dom'),
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                loadPaths: [
                    path.resolve(root, 'develop/tokens'),
                    path.resolve(root, 'design-system/src/styles'),
                ],
            },
        },
    },
    server: {
        port: 3008,
        open: true
    }
});
