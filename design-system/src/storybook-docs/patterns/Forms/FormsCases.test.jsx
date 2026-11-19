import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CODE, EditInModal, EditInPanel, ErrorInSecondDialog, ErrorOnField, OneColumnFields, TwoColumnFields } from './FormsCases.jsx';

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

    it('prints each example from its own source, with the helpers it reads and the PLUS imports it needs', () => {
        expect(Object.keys(CODE)).toEqual(['OneColumnFields', 'TwoColumnFields', 'EditInPanel', 'EditInModal', 'ErrorOnField', 'ErrorInSecondDialog']);
        expect(CODE.EditInPanel).toContain('const SessionFields');
        expect(CODE.EditInPanel).toContain('const SessionsBehind');
        expect(CODE.EditInPanel).toMatch(/from '@\/templates';/);
        expect(CODE.ErrorOnField).toContain('const LogSessionFooter');
        expect(CODE.ErrorInSecondDialog).toContain('<Modal');
        for (const code of Object.values(CODE)) expect(code).not.toMatch(/Example\.|storybook-docs|formHosts/);
    });
});
