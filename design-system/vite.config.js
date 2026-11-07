import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'fs';
import { resolve } from 'path';

// design-system/ declares no dependencies: it runs on the root install. A
// leftover design-system/node_modules shadows the root for every test file and
// loads a second React, which surfaces as hundreds of unrelated hook errors.
const stray = resolve(__dirname, 'node_modules');
if (existsSync(resolve(stray, 'react'))) {
    throw new Error(`Remove ${stray}: a stale install there loads a second React beside the root's.`);
}

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
