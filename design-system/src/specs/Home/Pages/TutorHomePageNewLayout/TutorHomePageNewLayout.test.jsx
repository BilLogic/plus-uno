import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// The pages load the chart library, which asks `CSS.supports` on load; jsdom has no such function.
vi.hoisted(() => {
    globalThis.CSS = globalThis.CSS || {};
    if (typeof globalThis.CSS.supports !== 'function') globalThis.CSS.supports = () => false;
});

import {
    TutorHomePageNewLayout,
    TutorHomePageSkillsOverview,
    TutorHomePageSkillsOverviewDifferentLayout,
    TutorHomePageSkillsProgress,
} from '@/specs/Home/Pages';

/**
 * The heading outline and the "before" pages. Where each block sits at 768,
 * 1024 and 1440 needs a browser and is asserted in the stories beside this
 * file; this one holds the tags, which jsdom renders the same at every width.
 */
const outline = () => screen.queryAllByRole('heading').map((h) => [h.tagName.toLowerCase(), h.textContent]);

describe('Home (new layout)', () => {
    it('is one h1, the greeting, with an h2 for each section and card title', () => {
        render(<TutorHomePageNewLayout />);
        expect(outline()).toEqual([
            ['h1', 'Sign up for your next session, John!'],
            ['h2', 'My Badge'],
            ['h2', 'Your Impact'],
            ['h2', 'Personalized Recommendations'],
        ]);
    });
});

describe('the Home pages it sits beside', () => {
    it.each([
        ['Skills Overview', TutorHomePageSkillsOverview],
        ['Skills Progress', TutorHomePageSkillsProgress],
        ['Skills Overview, different layout', TutorHomePageSkillsOverviewDifferentLayout],
    ])('%s still renders, its outline topped by the page h1', (_, Page) => {
        render(<Page tutorName="John Doe" />);
        const [top] = outline();
        expect(top).toEqual(['h1', 'Home']);
        expect(screen.getByText(/Sign up for your next session, John Doe!/)).toBeTruthy();
    });
});
