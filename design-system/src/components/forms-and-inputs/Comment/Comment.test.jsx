import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Heading from '@/components/text-and-data-display/Heading';
import Comment from './Comment';

describe('Comment', () => {
    it('renders author, time and content', () => {
        render(<Comment author="Ari" time="2h ago" content="Hello" />);
        expect(screen.getByText('Ari')).toBeInTheDocument();
        expect(screen.getByText('2h ago')).toBeInTheDocument();
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('hides actions and shows savingText while isSaving', () => {
        render(<Comment author="Ari" content="Hello" actions={<button type="button">Reply</button>} isSaving savingText="Saving…" />);
        expect(screen.queryByRole('button', { name: 'Reply' })).toBeNull();
        expect(screen.getByText('Saving…')).toBeInTheDocument();
    });

    it('shows actions when not saving', () => {
        render(<Comment author="Ari" content="Hello" actions={<button type="button">Reply</button>} />);
        expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
    });

    it('pins nestedReplies headings to headingLevel via HeadingContextProvider', () => {
        render(
            <Comment
                author="Ari"
                content="Top"
                nestedReplies={<Heading size="xsmall">Reply heading</Heading>}
                headingLevel={3}
            />
        );
        expect(screen.getByText('Reply heading').tagName).toBe('H3');
    });
});
