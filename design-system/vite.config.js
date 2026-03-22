import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react({
            // Use automatic JSX runtime (React 17+/18+)
            jsxRuntime: 'automatic'
        }),
        dts({
            insertTypesEntry: true,
            include: ['src'],
            exclude: ['**/*.stories.jsx', '**/*.test.jsx', '**/demo/**/*']
        })
    ],
    css: {
        preprocessorOptions: {
            scss: {
                includePaths: [resolve(__dirname, 'src/components')]
            }
        }
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            name: 'PlusDS',
            formats: ['es', 'cjs'],
            fileName: (format) => format === 'es' ? 'index.esm.js' : 'index.js'
        },
        rolldownOptions: {
            // Externalize peer dependencies - consumers provide these
            // NOTE: prop-types and classnames are NOT externalized - they are bundled
            // because ESM consumers cannot resolve external globals like UMD can
            external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                'react/jsx-dev-runtime',
                'bootstrap',
                'react-bootstrap'
            ],
            output: {
                // Ensure proper ESM format
                interop: 'auto',
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'jsxRuntime',
                    'bootstrap': 'bootstrap',
                    'react-bootstrap': 'ReactBootstrap'
                },
                // Export as named exports
                exports: 'named'
            }
        },
        cssCodeSplit: false,
        sourcemap: true,
        // Ensure modern ES target for Vite consumers
        target: 'esnext',
        // Keep readable for debugging
        minify: false
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
