/**
 * Post-Session Tables — Reflections
 *
 * Re-exports the shared Reflections table organism (also used on the
 * Pre-Session Sessions → Reflections entry page) under the Post-Session
 * taxonomy so Storybook matches Figma Components (Local organisms) → Tables.
 */
import {
    Overview as ReflectionsOverview,
    Interactive as ReflectionsInteractive,
} from '@/specs/Toolkit/Pre-Session/Tables/ReflectionsTable.stories.jsx';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Tables/Reflections',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Local organism — Table / Reflections (header + list item · new/complete/incomplete · hover).',
            },
        },
    },
};

export const Overview = ReflectionsOverview;
export const Interactive = ReflectionsInteractive;
