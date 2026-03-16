import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@plus-ds': path.resolve(__dirname, '../../../../packages/plus-ds/src'),
            '@': path.resolve(__dirname, '../../../../packages/plus-ds/src'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                includePaths: [path.resolve(__dirname, '../../../../packages/plus-ds/src')],
            },
        },
    },
})
