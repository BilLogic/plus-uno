import React from 'react';
import { render } from '@testing-library/react';
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
import { DocsOverlayBoundary } from './docs-overlay-boundary';

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
});
