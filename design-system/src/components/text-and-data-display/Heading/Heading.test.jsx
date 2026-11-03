import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Heading, { HeadingContextProvider } from './Heading';

describe('Heading', () => {
    it('defaults xxlarge to h1 and xxsmall to h6', () => {
        render(<Heading size="xxlarge">Big</Heading>);
        expect(screen.getByText('Big').tagName).toBe('H1');
        render(<Heading size="xxsmall">Small</Heading>);
        expect(screen.getByText('Small').tagName).toBe('H6');
    });

    it('lets `as` override the size default', () => {
        render(<Heading size="xxlarge" as="h3">Styled big, semantic h3</Heading>);
        expect(screen.getByText('Styled big, semantic h3').tagName).toBe('H3');
    });

    it('takes its tag from the nearest HeadingContextProvider when `as` is not given', () => {
        render(
            <HeadingContextProvider level={2}>
                <Heading size="xsmall">Pinned</Heading>
            </HeadingContextProvider>
        );
        expect(screen.getByText('Pinned').tagName).toBe('H2');
    });

    it('`as` still wins over a HeadingContextProvider', () => {
        render(
            <HeadingContextProvider level={2}>
                <Heading size="xsmall" as="h5">Explicit</Heading>
            </HeadingContextProvider>
        );
        expect(screen.getByText('Explicit').tagName).toBe('H5');
    });
});
