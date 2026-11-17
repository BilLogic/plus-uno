import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    Button,
    ButtonItem,
    DropdownMenu,
    FilterMenu,
    Popup,
    PopupSelect,
    Spotlight,
    SpotlightProvider,
    SpotlightTarget,
    Tooltip,
} from '@/components';
import { DocsOverlayBoundary, MIN_FIT_ZOOM, fitZoom } from './docs-overlay-boundary';

describe('DocsOverlayBoundary', () => {
    it('keeps Spotlight, Popup, Tooltip, DropdownMenu, FilterMenu and PopupSelect inside their docs canvas', () => {
        const { container } = render(
            <div>
                <DocsOverlayBoundary disablePointerEvents>
                    <SpotlightProvider>
                        <SpotlightTarget><Button text="Create" /></SpotlightTarget>
                        <Spotlight headline="Step in a tour" placement="bottom">Start here.</Spotlight>
                    </SpotlightProvider>
                </DocsOverlayBoundary>

                <DocsOverlayBoundary>
                    <Popup trigger={<Button text="Details" />} title="Session 12" placement="bottom" triggerType="manual" show>
                        Ran over.
                    </Popup>
                </DocsOverlayBoundary>

                <DocsOverlayBoundary>
                    <Tooltip text="Opens notes" placement="bottom" show>
                        <Button text="Notes" />
                    </Tooltip>
                </DocsOverlayBoundary>

                <DocsOverlayBoundary>
                    <DropdownMenu trigger={<Button text="Actions" />} placement="bottom-start" isOpen onOpenChange={() => {}}>
                        <ButtonItem onClick={() => {}}>Rename</ButtonItem>
                    </DropdownMenu>
                </DocsOverlayBoundary>

                <DocsOverlayBoundary>
                    <FilterMenu
                        categories={[{ id: 'status', label: 'Status', options: ['Upcoming'] }]}
                        defaultOpen
                    />
                </DocsOverlayBoundary>

                <DocsOverlayBoundary>
                    <PopupSelect
                        label="Status"
                        options={['Upcoming', 'Completed']}
                        defaultOpen
                    />
                </DocsOverlayBoundary>
            </div>,
        );

        const boundaries = [...container.querySelectorAll('[data-docs-overlay-container]')];
        expect(boundaries).toHaveLength(6);
        expect(boundaries[0].style.pointerEvents).toBe('none');
        expect(boundaries[1].style.pointerEvents).toBe('');

        expect(boundaries[0].querySelector('.plus-spotlight')).not.toBeNull();
        expect(boundaries[1].querySelector('.plus-popup')).not.toBeNull();
        expect(boundaries[2].querySelector('[role="tooltip"]')).not.toBeNull();
        expect(boundaries[3].querySelector('.plus-dropdown-menu')).not.toBeNull();
        expect(boundaries[4].querySelector('.plus-filter-menu')).not.toBeNull();
        expect(boundaries[5].querySelector('.plus-popup-select')).not.toBeNull();

        // Every one of them kept its bottom placement and stayed out of document.body's top-level portals.
        for (const boundary of boundaries) {
            expect(boundary.querySelector('[data-side]')).toHaveAttribute('data-side', 'bottom');
        }
    });

    it('expands minHeight for an open overlay when containHeight is set, never zooms, and releases minHeight on close', async () => {
        const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
        const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
        const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 32 });
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 300 });
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => 680 });
        const rectSpy = (el) => {
            if (el.hasAttribute?.('data-docs-overlay-container')) {
                return { top: 10, bottom: 42, left: 0, right: 300, width: 300, height: 32 };
            }
            if (el.hasAttribute?.('data-side')) {
                return { top: 46, bottom: 186, left: 0, right: 240, width: 240, height: 140 };
            }
            return { top: 10, bottom: 42, left: 0, right: 100, width: 100, height: 32 };
        };
        const originalGBCR = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = function mockRect() {
            return rectSpy(this);
        };

        try {
            const { container, rerender } = render(
                <DocsOverlayBoundary fit={false} containHeight>
                    <button type="button">Trigger</button>
                    <div data-side="bottom">Open overlay</div>
                </DocsOverlayBoundary>,
            );
            const host = container.querySelector('[data-docs-overlay-container]');
            expect(host.style.minHeight).toBe('176px');
            expect(host.style.zoom).toBe('');
            expect(host.style.width).toBe('100%');
            expect(host.getAttribute('data-docs-fit')).toBeNull();

            rerender(
                <DocsOverlayBoundary fit={false} containHeight>
                    <button type="button">Trigger</button>
                </DocsOverlayBoundary>,
            );
            await waitFor(() => expect(host.style.minHeight).toBe(''));
        } finally {
            Element.prototype.getBoundingClientRect = originalGBCR;
            if (originalClientHeight) {
                Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight);
            } else {
                delete HTMLElement.prototype.clientHeight;
            }
            if (originalClientWidth) {
                Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
            } else {
                delete HTMLElement.prototype.clientWidth;
            }
            if (originalScrollWidth) {
                Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalScrollWidth);
            } else {
                delete HTMLElement.prototype.scrollWidth;
            }
        }
    });
});

describe('fitZoom', () => {
    it('leaves an example that fits at 1', () => {
        expect(fitZoom(600, 800)).toBe(1);
        expect(fitZoom(800, 800)).toBe(1);
    });
    it('zooms a wider example to the preview width', () => {
        expect(fitZoom(1600, 800)).toBe(0.5);
        expect(fitZoom(1000, 800)).toBeCloseTo(0.8);
    });
    it('never zooms below the legibility floor', () => {
        expect(fitZoom(4000, 800)).toBe(MIN_FIT_ZOOM);
    });
    it('ignores unmeasured boxes', () => {
        expect(fitZoom(0, 800)).toBe(1);
        expect(fitZoom(1200, 0)).toBe(1);
    });
});
