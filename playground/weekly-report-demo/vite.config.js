import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Repo root: two levels up from playground/weekly-report-demo
const root = path.resolve(__dirname, '../..');

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
                api: 'modern-compiler',
                loadPaths: [
                    path.resolve(root, 'design-system/src/tokens'),
                    path.resolve(root, 'design-system/src/styles'),
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
