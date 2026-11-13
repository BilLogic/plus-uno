import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroCard } from './HeroCard.jsx';
import { HEROES } from './hero-registry.jsx';

describe('HeroCard', () => {
  it('draws the registry hero and names it with its description', () => {
    const { container } = render(<HeroCard page="foundations-visual-color" />);
    const card = screen.getByRole('img', { name: HEROES['foundations-visual-color'].description });
    expect(card).toBe(container.querySelector('[data-hero-card="foundations-visual-color"]'));
    expect(card.querySelector('svg, .sb-docs-hero__pane')).not.toBeNull();
  });

  it('draws no text', () => {
    render(<HeroCard page="templates-page-page" />);
    const card = screen.getByRole('img');
    expect(document.createTreeWalker(card, NodeFilter.SHOW_TEXT).nextNode()).toBeNull();
  });

  it('renders every registry page', () => {
    for (const id of Object.keys(HEROES)) {
      const { container, unmount } = render(<HeroCard page={id} />);
      expect(container.querySelector(`[data-hero-card="${id}"]`), id).not.toBeNull();
      unmount();
    }
  });

  it('renders nothing for an unknown page', () => {
    const { container } = render(<HeroCard page="nope" />);
    expect(container).toBeEmptyDOMElement();
  });
});
