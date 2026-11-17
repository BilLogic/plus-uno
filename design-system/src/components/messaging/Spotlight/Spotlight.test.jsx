import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OverlayContainer } from '@/lib/overlay';
import Spotlight, { SpotlightAction, SpotlightProvider, SpotlightTarget } from './Spotlight';

function renderSpotlight(extraProps = {}) {
    return render(
        <SpotlightProvider>
            <SpotlightTarget><button type="button">Target</button></SpotlightTarget>
            <Spotlight headline="Headline" {...extraProps}>Body text</Spotlight>
        </SpotlightProvider>
    );
}

describe('Spotlight', () => {
    it('renders the headline, body and a dismiss control by default', () => {
        renderSpotlight();
        expect(screen.getByText('Headline')).toBeInTheDocument();
        expect(screen.getByText('Body text')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });

    it('omits the dismiss control when dismissible is false', () => {
        renderSpotlight({ dismissible: false });
        expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    });

    it('calls onDismiss when the dismiss control is clicked', async () => {
        const onDismiss = vi.fn();
        const { getByRole } = renderSpotlight({ onDismiss });
        getByRole('button', { name: 'Dismiss' }).click();
        expect(onDismiss).toHaveBeenCalled();
    });

    it('renders the step count when given', () => {
        renderSpotlight({ stepCount: '2 of 4' });
        expect(screen.getByText('2 of 4')).toBeInTheDocument();
    });

    it('portals to document.body in the app, and stays inside an OverlayContainer when bounded', () => {
        const { container: appRoot, unmount } = renderSpotlight({ headline: 'App spotlight' });
        expect(appRoot.querySelector('.plus-spotlight')).toBeNull();
        expect(document.body.querySelector('.plus-spotlight')).not.toBeNull();
        unmount();

        const canvas = document.createElement('div');
        document.body.appendChild(canvas);
        render(
            <OverlayContainer container={canvas}>
                <SpotlightProvider>
                    <SpotlightTarget><button type="button">Target</button></SpotlightTarget>
                    <Spotlight headline="Docs spotlight" placement="bottom">Body text</Spotlight>
                </SpotlightProvider>
            </OverlayContainer>,
        );
        const popup = canvas.querySelector('.plus-spotlight');
        expect(popup).not.toBeNull();
        expect(popup.closest('[data-side]')).toHaveAttribute('data-side', 'bottom');
        canvas.remove();
    });
});

describe('SpotlightAction', () => {
    it('renders a link when href is given', () => {
        render(<SpotlightAction href="/x">Go</SpotlightAction>);
        expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '/x');
    });

    it('renders a button otherwise', () => {
        render(<SpotlightAction>Go</SpotlightAction>);
        expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    });
});
