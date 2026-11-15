import { describe, expect, it } from 'vitest';
import { reducedStory, story } from './motion-story-helpers.jsx';

// A docs page shows a motion page's figures through `<Canvas of={Story}>`, the
// same stories the play tests run. The tests fast-forward; the page must not.
const demo = { title: 'A demo', scenes: [] };

describe('motion stories', () => {
  it('play at 1× on a docs page', () => {
    expect(story(demo).render({}, { viewMode: 'docs' }).props.fastForward).toBe(1);
  });
  it('fast-forward only when a test runs the story', () => {
    expect(story(demo).render({}, { viewMode: 'story' }).props.fastForward).toBeGreaterThan(1);
  });
  it('keep the reduced twin still on either surface', () => {
    expect(reducedStory(demo).render({}, { viewMode: 'docs' }).props.reduced).toBe(true);
  });
});
