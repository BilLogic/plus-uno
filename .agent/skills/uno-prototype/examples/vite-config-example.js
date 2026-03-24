/**
 * Canonical Vite config for a playground prototype.
 *
 * Copy this file to playground/{your-project}/vite.config.js and update:
 *   1. The server.port — pick an unused port (check other playground configs)
 *   2. The comment at the top describing your prototype
 *
 * The alias paths use ../../../../ to reach design-system/src from
 * playground/{project}/ (two levels up to repo root, then into design-system).
 * If your prototype is nested differently, adjust the path depth.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

/** ESM-safe __dirname — required because Vite configs use ES modules */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    /**
     * root tells Vite where to find index.html.
     * Setting it to __dirname means Vite serves from this directory,
     * which is important when running from the repo root via
     *   vite --config playground/{project}/vite.config.js
     */
    root: __dirname,

    plugins: [react()],

    resolve: {
        alias: {
            /**
             * @tutors.plus/design-system — package-style import for the DS entry point.
             * Use: import { Button } from '@tutors.plus/design-system'
             */
            '@tutors.plus/design-system': path.resolve(__dirname, '../../../../design-system/src/index.js'),

            /**
             * @ — shorthand alias into design-system/src for component imports.
             * Use: import Button from '@/components/Button'
             */
            '@': path.resolve(__dirname, '../../../../design-system/src'),

            /**
             * Pin react and react-dom to the repo root's copies.
             * This prevents duplicate React instances when the DS
             * and the prototype both import React.
             */
            react: path.resolve(__dirname, '../../../../node_modules/react'),
            'react-dom': path.resolve(__dirname, '../../../../node_modules/react-dom'),
        },
    },

    server: {
        /** Pick a unique port — avoid collisions with other playground prototypes */
        port: 3020,
        /** host: true makes the server accessible on the local network */
        host: true,
        /** strictPort: false means Vite will try the next port if this one is taken */
        strictPort: false,
    },

    css: {
        preprocessorOptions: {
            scss: {
                /**
                 * modern-compiler API avoids deprecation warnings in newer Sass.
                 * silenceDeprecations suppresses known harmless warnings from
                 * Bootstrap's use of @import and legacy JS API.
                 */
                api: 'modern-compiler',
                silenceDeprecations: ['import', 'legacy-js-api'],
            },
        },
    },
});
