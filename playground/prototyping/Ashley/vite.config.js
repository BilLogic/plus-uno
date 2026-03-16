
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { fileURLToPath } from 'url';

// Get current directory of this config file
const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);
const rootDir = path.resolve(currentDir, '../../../'); // Back up 3 levels to project root

export default defineConfig({
    plugins: [react()],
    root: currentDir, // Set root to playground/Ashley
    base: '/',
    resolve: {
        alias: {
            '@': path.resolve(rootDir, './packages/plus-ds/src'),
            '@plus-ds': path.resolve(rootDir, './packages/plus-ds/src'),
            '~': path.resolve(rootDir, './node_modules'),
            // Mock Storybook links add-on so it doesn't crash outside Storybook
            '@storybook/addon-links': path.resolve(currentDir, './mock-storybook-links.js')
        }
    },
    server: {
        port: 3005 // Use a different port to avoid conflicts
    },
    build: {
        outDir: path.resolve(rootDir, 'dist-ashley'), // Output to dist-ashley in project root
        emptyOutDir: true
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                loadPaths: [
                    path.resolve(rootDir, 'packages/plus-ds/src/tokens'),
                    path.resolve(rootDir, 'packages/plus-ds/src/styles'),
                    path.resolve(rootDir, 'packages/plus-ds/src/forms')
                ],
                silenceDeprecations: ['import', 'legacy-js-api']
            }
        }
    }
});
