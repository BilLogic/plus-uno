import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import {
    ModalFooterFullBleedCase,
    ModalFooterInsetCase,
    OnePrimaryCase,
    PageButtonsFarRightCase,
    PageButtonsLeftCase,
    TwoPrimariesCase,
} from './commonActionsDemo.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('CommonActions live cases and links', () => {
    it('OnePrimaryCase renders one primary button and one default button with interactive controls', async () => {
        const user = userEvent.setup();
        render(<OnePrimaryCase />);
        const primary = screen.getByRole('button', { name: 'Save session' });
        expect(primary.className).toContain('primary');
        expect(screen.getByRole('button', { name: 'Save draft' }).className).toContain('default');
        const student = screen.getByRole('textbox', { name: 'Student' });
        await user.clear(student);
        await user.type(student, 'Marcus Lee');
        expect(student).toHaveValue('Marcus Lee');
        primary.focus();
        expect(primary).toHaveFocus();
    });

    it('TwoPrimariesCase renders two competing primary buttons with interactive controls', async () => {
        const user = userEvent.setup();
        render(<TwoPrimariesCase />);
        const primary = screen.getByRole('button', { name: 'Save session' });
        expect(primary.className).toContain('primary');
        expect(screen.getByRole('button', { name: 'Save draft' }).className).toContain('primary');
        const student = screen.getByRole('textbox', { name: 'Student' });
        await user.clear(student);
        await user.type(student, 'Sofia Ramirez');
        expect(student).toHaveValue('Sofia Ramirez');
        primary.focus();
        expect(primary).toHaveFocus();
    });

    it('PageButtonsLeftCase and PageButtonsFarRightCase render live interactive page form controls', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<PageButtonsLeftCase />);
        const student = screen.getByRole('textbox', { name: 'Student' });
        expect(student).toHaveValue('Ana Ruiz');
        await user.clear(student);
        await user.type(student, 'Jordan Kim');
        expect(student).toHaveValue('Jordan Kim');
        const saveLeft = screen.getByRole('button', { name: 'Save session' });
        saveLeft.focus();
        expect(saveLeft).toHaveFocus();
        expect(screen.getByRole('button', { name: 'Cancel' }).className).toContain('subtle');
        unmount();

        render(<PageButtonsFarRightCase />);
        const site = screen.getByRole('textbox', { name: 'Site' });
        expect(site).toHaveValue('Lincoln Middle');
        await user.clear(site);
        await user.type(site, 'North High');
        expect(site).toHaveValue('North High');
        const saveRight = screen.getByRole('button', { name: 'Save session' });
        saveRight.focus();
        expect(saveRight).toHaveFocus();
    });

    it('ModalFooterFullBleedCase and ModalFooterInsetCase render live interactive Dialog footers', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<ModalFooterFullBleedCase />);
        expect(screen.getByRole('heading', { name: 'Log a session' })).toBeInTheDocument();
        const fullBleedStudent = screen.getByRole('textbox', { name: 'Student' });
        await user.clear(fullBleedStudent);
        await user.type(fullBleedStudent, 'Ava Thompson');
        expect(fullBleedStudent).toHaveValue('Ava Thompson');
        const save = screen.getByRole('button', { name: 'Save session' });
        save.focus();
        expect(save).toHaveFocus();
        unmount();

        render(<ModalFooterInsetCase />);
        expect(screen.getByRole('heading', { name: 'Log a session' })).toBeInTheDocument();
        const insetStudent = screen.getByRole('textbox', { name: 'Student' });
        await user.clear(insetStudent);
        await user.type(insetStudent, 'Noah Patel');
        expect(insetStudent).toHaveValue('Noah Patel');
        const discard = screen.getByRole('button', { name: 'Discard' });
        discard.focus();
        expect(discard).toHaveFocus();
    });

    it('links every TypeCard anchor to a unique ComponentExample heading id in CommonActions.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'CommonActions.mdx'), 7);
    });
});
