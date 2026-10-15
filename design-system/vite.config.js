import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react({
            // Use automatic JSX runtime (React 17+/18+)
            jsxRuntime: 'automatic'
        })
    ],
    css: {
        preprocessorOptions: {
            scss: {
                includePaths: [resolve(__dirname, 'src/components')]
            }
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.js'
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    }
});
