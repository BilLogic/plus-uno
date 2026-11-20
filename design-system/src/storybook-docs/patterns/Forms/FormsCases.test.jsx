import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CODE, EditInModal, EditInPanel, ErrorInSecondDialog, ErrorOnField, HelpInCaptionCase, HelpInTooltipCase, MajorityMarked, MinorityMarked, OneColumnFields, TwoColumnFields } from './FormsCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Forms live cases', () => {
    it('EditInPanel keeps the rows beside the edit, while EditInModal covers them with a Blanket', () => {
        const r1 = render(<EditInPanel />);
        expect(screen.getByRole('heading', { name: 'Ana Ruiz' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /Student/ })).toHaveValue('Ana Ruiz');
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        expect(screen.getByText('Sessions')).toBeInTheDocument();
        expect(document.querySelector('.plus-modal-blanket')).toBeNull();
        r1.unmount();

        render(<EditInModal />);
        expect(screen.getByRole('textbox', { name: /Student/ })).toHaveValue('Ana Ruiz');
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        expect(screen.getByText('Sessions')).toBeInTheDocument();
        expect(document.querySelector('.plus-modal-blanket')).not.toBeNull();
    });

    it('OneColumnFields pairs date and time; TwoColumnFields scatters unrelated fields', () => {
        const one = render(<OneColumnFields />);
        expect(screen.getByRole('textbox', { name: /Session date/ })).toHaveValue('Thu, Oct 24');
        expect(screen.getByRole('textbox', { name: /Start time/ })).toHaveValue('4:00 PM');
        one.unmount();
        render(<TwoColumnFields />);
        expect(screen.getByRole('textbox', { name: /Subject/ })).toHaveValue('Algebra B');
        expect(screen.getByRole('textbox', { name: /Notes/ })).toHaveValue('Worked through fractions');
    });

    it('ErrorOnField explains the field inside one dialog; ErrorInSecondDialog opens a second and leaves the field bare', () => {
        const onField = render(<ErrorOnField />);
        expect(screen.getAllByRole('dialog')).toHaveLength(1);
        expect(screen.getByText('Enter the student’s name')).toBeInTheDocument();
        onField.unmount();
        render(<ErrorInSecondDialog />);
        expect(screen.getAllByRole('dialog')).toHaveLength(2);
        expect(screen.queryByText('Enter the student’s name')).toBeNull();
    });

    it('MinorityMarked marks only the optional field; MajorityMarked repeats (required) on the others', () => {
        const minority = render(<MinorityMarked />);
        expect(minority.container.textContent).not.toContain('(required)');
        expect(minority.container.textContent).toContain('(optional)');
        minority.unmount();
        const majority = render(<MajorityMarked />);
        expect(majority.container.textContent.match(/\(required\)/g)).toHaveLength(2);
    });

    it('HelpInCaptionCase renders visible standing help in the caption while HelpInTooltipCase puts it in an info button', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<HelpInCaptionCase />);
        const captionInput = screen.getByRole('textbox', { name: 'School email' });
        const caption = screen.getByText('Shared with your site supervisor.');
        expect(captionInput.getAttribute('aria-describedby')).toContain(caption.id);
        await user.clear(captionInput);
        await user.type(captionInput, 'marcus.lee@lincoln.edu');
        expect(captionInput).toHaveValue('marcus.lee@lincoln.edu');
        unmount();

        render(<HelpInTooltipCase />);
        const tooltipInput = screen.getByRole('textbox', { name: 'School email' });
        expect(tooltipInput).toHaveValue('ana.ruiz@lincoln.edu');
        await user.clear(tooltipInput);
        await user.type(tooltipInput, 'sofia.ramirez@lincoln.edu');
        expect(tooltipInput).toHaveValue('sofia.ramirez@lincoln.edu');
        const infoBtn = screen.getByRole('button', { name: 'About School email' });
        infoBtn.focus();
        expect(infoBtn).toHaveFocus();
        expect(screen.queryByText('Shared with your site supervisor.')).toBeNull();
    });

    it('prints each example from its own source, with the helpers it reads and the PLUS imports it needs', () => {
        expect(Object.keys(CODE)).toEqual([
            'OneColumnFields', 'TwoColumnFields', 'EditInPanel', 'EditInModal', 'ErrorOnField', 'ErrorInSecondDialog',
            'MinorityMarked', 'MajorityMarked', 'HelpInCaption', 'HelpInTooltip',
        ]);
        expect(CODE.EditInPanel).toContain('const SessionFields');
        expect(CODE.EditInPanel).toContain('const SessionsBehind');
        expect(CODE.EditInPanel).toMatch(/from '@\/templates';/);
        expect(CODE.EditInModal).toContain('<Modal show title="Ana Ruiz"');
        expect(CODE.EditInModal).not.toContain('inline');
        expect(CODE.EditInModal).not.toMatch(/Dialog|Blanket|100%/);
        expect(CODE.EditInPanel).not.toContain('flex');
        expect(CODE.ErrorOnField).toContain('const LogSessionFooter');
        for (const key of ['EditInModal', 'ErrorOnField', 'ErrorInSecondDialog']) expect(CODE[key]).not.toContain('Cancel');
        expect(CODE.ErrorOnField).toContain('text="Discard"');
        expect(CODE.ErrorInSecondDialog).toContain('<Modal');
        for (const code of Object.values(CODE)) expect(code).not.toMatch(/Example\.|storybook-docs|formHosts/);
    });
});
