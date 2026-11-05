import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PanelContainer, {
    PanelBody, PanelCloseAction, PanelHeader, PanelHostContext, PanelProvider, usePanelManager,
} from './Panel';

describe('Panel', () => {
    it('composes a header and body', () => {
        render(
            <PanelContainer>
                <PanelHeader title="Details" />
                <PanelBody>Content</PanelBody>
            </PanelContainer>
        );
        expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('defaults its width to 400px, the Panel area default, with no provider or prop', () => {
        const { container } = render(<PanelContainer><PanelBody>X</PanelBody></PanelContainer>);
        expect(container.firstChild).toHaveStyle({ width: '400px' });
    });

    it('PanelProvider defaults to 400px', () => {
        const { container } = render(<PanelProvider><PanelContainer><PanelBody>X</PanelBody></PanelContainer></PanelProvider>);
        expect(container.firstChild).toHaveStyle({ width: '400px' });
    });

    it('inside a host it fills the host and leaves the fill and edge to it', () => {
        const { container } = render(
            <PanelHostContext.Provider value>
                <PanelContainer width="240px"><PanelBody>X</PanelBody></PanelContainer>
            </PanelHostContext.Provider>
        );
        expect(container.firstChild).toHaveStyle({ width: '100%' });
        expect(container.firstChild).toHaveClass('plus-panel--hosted');
    });

    it('takes its width from the nearest PanelProvider', () => {
        const { container } = render(
            <PanelProvider defaultWidth="480px">
                <PanelContainer><PanelBody>X</PanelBody></PanelContainer>
            </PanelProvider>
        );
        expect(container.firstChild).toHaveStyle({ width: '480px' });
    });

    it('an explicit width prop wins over the provider', () => {
        const { container } = render(
            <PanelProvider defaultWidth="480px">
                <PanelContainer width="240px"><PanelBody>X</PanelBody></PanelContainer>
            </PanelProvider>
        );
        expect(container.firstChild).toHaveStyle({ width: '240px' });
    });

    it('PanelCloseAction is labeled Close', () => {
        render(<PanelCloseAction />);
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('usePanelManager throws outside a PanelProvider', () => {
        const Probe = () => { usePanelManager(); return null; };
        expect(() => render(<Probe />)).toThrow('usePanelManager must be used within a PanelProvider');
    });
});
