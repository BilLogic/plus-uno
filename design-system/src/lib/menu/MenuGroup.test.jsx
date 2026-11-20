import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MenuGroup, ButtonItem, LinkItem, Section } from './index';

describe('MenuGroup', () => {
    it('renders ButtonItem and LinkItem rows with the menuitem role', () => {
        render(
            <MenuGroup>
                <ButtonItem>Action</ButtonItem>
                <LinkItem href="/go">Navigate</LinkItem>
            </MenuGroup>
        );
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Action' }).tagName).toBe('BUTTON');
        expect(screen.getByRole('menuitem', { name: 'Navigate' })).toHaveAttribute('href', '/go');
    });

    it('groups items under a titled Section', () => {
        render(
            <MenuGroup>
                <Section title="Recent">
                    <ButtonItem>Item</ButtonItem>
                </Section>
            </MenuGroup>
        );
        expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('moves focus between items with ArrowDown/ArrowUp, wrapping at the ends', () => {
        render(
            <MenuGroup>
                <ButtonItem>One</ButtonItem>
                <ButtonItem>Two</ButtonItem>
            </MenuGroup>
        );
        const [one, two] = screen.getAllByRole('menuitem');
        one.focus();
        fireEvent.keyDown(one, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(two);
        fireEvent.keyDown(two, { key: 'ArrowUp' });
        expect(document.activeElement).toBe(one);
    });

    it('skips a disabled item when moving focus', () => {
        render(
            <MenuGroup>
                <ButtonItem>One</ButtonItem>
                <ButtonItem isDisabled>Two</ButtonItem>
                <ButtonItem>Three</ButtonItem>
            </MenuGroup>
        );
        const [one, , three] = screen.getAllByRole('menuitem');
        one.focus();
        fireEvent.keyDown(one, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(three);
    });

    it('applies spacing classes for default, compact, and spacious and does not read density', () => {
        const { rerender } = render(
            <MenuGroup>
                <ButtonItem>One</ButtonItem>
            </MenuGroup>
        );
        const menu = screen.getByRole('menu');
        expect(menu).toHaveClass('plus-menu-group--default');

        rerender(
            <MenuGroup spacing="compact">
                <ButtonItem>One</ButtonItem>
            </MenuGroup>
        );
        expect(menu).toHaveClass('plus-menu-group--compact');

        rerender(
            <MenuGroup spacing="spacious">
                <ButtonItem>One</ButtonItem>
            </MenuGroup>
        );
        expect(menu).toHaveClass('plus-menu-group--spacious');

        rerender(
            <MenuGroup density="compact">
                <ButtonItem>One</ButtonItem>
            </MenuGroup>
        );
        expect(menu).toHaveClass('plus-menu-group--default');
        expect(menu).not.toHaveClass('plus-menu-group--compact');
    });
});
