import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Repo root: four levels up from playground/prototyping/bill/weekly-report
const root = path.resolve(__dirname, '../../../..');

export default defineConfig({
    plugins: [react()],
    root: __dirname,
    resolve: {
        alias: {
            '@': path.resolve(root, 'packages/plus-ds/src'),
            'react': path.resolve(root, 'node_modules/react'),
            'react-dom': path.resolve(root, 'node_modules/react-dom'),
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                loadPaths: [
                    path.resolve(root, 'develop/tokens'),
                    path.resolve(root, 'packages/plus-ds/src/styles'),
                ],
            },
        },
    },
    server: {
        port: 3009,
        open: true,
        fs: {
            allow: [
                // Allow serving files from the repo root (for shared assets/components)
                path.resolve(root),
            ],
        },
    }
});
