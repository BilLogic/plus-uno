import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@tutors.plus/design-system': path.resolve(__dirname, '../../../../packages/plus-ds/src/index.js'),
            '@': path.resolve(__dirname, '../../../../packages/plus-ds/src'),
            // Ensure React resolves to the one in root node_modules to avoid dual-instance issues
            'react': path.resolve(__dirname, '../../../../node_modules/react'),
            'react-dom': path.resolve(__dirname, '../../../../node_modules/react-dom'),
        }
    },
    server: {
        port: 3005 // Use a different port to avoid conflicts
    }
});
