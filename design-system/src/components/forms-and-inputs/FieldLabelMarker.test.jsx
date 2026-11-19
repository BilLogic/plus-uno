import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FieldLabel, LabelMarker } from './_internal/FieldFrame';
import Fieldset from './Fieldset';
import TextField from './TextField';
import TextArea from './TextArea';
import Select from './Select';
import Cascader from './Cascader';
import TreeSelect from './TreeSelect';
import TagInput from './TagInput';
import Checkbox from './Checkbox';
import CheckboxGroup from './CheckboxGroup';
import Radio from './Radio';
import RadioGroup from './RadioGroup';
import DateTimePicker from './DateTimePicker';
import FileUpload from './FileUpload';
import Rating from './Rating';
import Range from './Range';

describe('Form label minority markers', () => {
    it('FieldLabel renders plain label text and appends (required) or (optional) for the minority case', () => {
        const { container, rerender } = render(
            <FieldLabel htmlFor="f1" info="Roster name">Student</FieldLabel>
        );
        expect(container.querySelector('label')).toHaveTextContent(/^Student$/);
        expect(container.textContent).not.toContain('*');

        rerender(
            <FieldLabel htmlFor="f1" labelMarker="optional" info="Roster name">Notes</FieldLabel>
        );
        expect(container.querySelector('label')).toHaveTextContent(/^Notes \(optional\)$/);
        expect(screen.getByRole('button', { name: 'About Notes' })).toBeInTheDocument();

        rerender(
            <FieldLabel htmlFor="f1" labelMarker="required" info="Roster name">Student</FieldLabel>
        );
        expect(container.querySelector('label')).toHaveTextContent(/^Student \(required\)$/);
        expect(screen.getByRole('button', { name: 'About Student' })).toBeInTheDocument();
        expect(container.textContent).not.toContain('*');
    });

    it('Fieldset preserves screen-reader required name and supports labelMarker without star symbols', () => {
        const { container, rerender } = render(
            <Fieldset legend="Notify me by" isRequired>
                <Checkbox name="n1" label="Email" />
            </Fieldset>
        );
        const legend = container.querySelector('.plus-fieldset-legend');
        expect(legend.textContent).not.toContain('*');
        // Visually hidden (required) still informs screen readers when most fields are required.
        expect(screen.getByRole('group', { name: 'Notify me by (required)' })).toBeInTheDocument();
        expect(legend.querySelector('.visually-hidden')).not.toBeNull();

        // When required is the minority, visible "(required)" is rendered once (not duplicated).
        rerender(
            <Fieldset legend="Notify me by" isRequired labelMarker="required">
                <Checkbox name="n1" label="Email" />
            </Fieldset>
        );
        expect(legend).toHaveTextContent(/^Notify me by \(required\)$/);
        expect(legend.querySelector('.visually-hidden')).toBeNull();
        expect(screen.getByRole('group', { name: 'Notify me by (required)' })).toBeInTheDocument();

        // When optional is the minority, "(optional)" is rendered visibly.
        rerender(
            <Fieldset legend="Extras" labelMarker="optional">
                <Checkbox name="n1" label="Email" />
            </Fieldset>
        );
        expect(legend).toHaveTextContent(/^Extras \(optional\)$/);
    });

    it('isRequired sets aria-required/required without rendering a star symbol on any form field', () => {
        const { container } = render(
            <div>
                <TextField id="tf" label="Student" isRequired />
                <TextArea id="ta" label="Summary" isRequired />
                <Select id="sel" label="Site" options={[{ value: 'a', label: 'Site A' }]} isRequired />
                <Cascader id="cas" label="Location" options={[{ value: 'pgh', label: 'Pittsburgh' }]} isRequired />
                <TreeSelect id="tree" label="Topic" options={[{ value: 'alg', label: 'Algebra' }]} isRequired />
                <TagInput id="tags" label="Tags" options={['Math']} isRequired />
                <Checkbox id="cb" label="Agree" isRequired />
                <CheckboxGroup legend="Subjects" options={['Math', 'Reading']} isRequired />
                <Radio id="rad" name="rad" value="1" label="Weekly" isRequired />
                <RadioGroup name="rg" legend="Format" options={['In person', 'Video']} isRequired />
                <DateTimePicker id="dt" label="Session time" isRequired />
                <FileUpload id="fu" label="Worksheet" isRequired />
                <Rating id="rat" label="Session rating" value={0} isRequired />
            </div>
        );

        expect(container.textContent).not.toContain('*');
        expect(screen.getByRole('textbox', { name: 'Student' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('textbox', { name: 'Summary' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('combobox', { name: 'Site' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('combobox', { name: 'Location' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('combobox', { name: 'Topic' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('combobox', { name: 'Tags' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('checkbox', { name: 'Agree' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('radiogroup', { name: /Format/ })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('radiogroup', { name: 'Session rating' })).toHaveAttribute('aria-required', 'true');
        expect(container.querySelector('#fu')).toHaveAttribute('aria-required', 'true');
        expect(container.querySelector('#dt-date')).toHaveAttribute('aria-required', 'true');
        expect(container.querySelector('#dt-time')).toHaveAttribute('aria-required', 'true');
    });

    it('labelMarker="optional" and labelMarker="required" mark the minority across form controls', () => {
        const { container } = render(
            <div>
                <TextField id="tf-opt" label="Notes" labelMarker="optional" />
                <TextField id="tf-req" label="Email" isRequired labelMarker="required" />
                <Select
                    id="sel-opt"
                    label="Secondary site"
                    labelMarker="optional"
                    marker="radio"
                    options={[{ value: 'a', label: 'Site A' }]}
                />
                <CheckboxGroup legend="Extra topics" options={['Geometry']} labelMarker="optional" />
                <RadioGroup name="rg-req" legend="Attendance" options={['Present', 'Absent']} isRequired labelMarker="required" />
                <DateTimePicker id="dt-opt" label="Follow-up" labelMarker="optional" />
                <FileUpload id="fu-opt" label="Attachment" labelMarker="optional" />
                <Rating id="rat-req" label="Confidence" value={0} isRequired labelMarker="required" />
            </div>
        );

        expect(container.textContent).not.toContain('*');
        expect(screen.getByRole('textbox', { name: 'Notes (optional)' })).not.toHaveAttribute('aria-required');
        expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('combobox', { name: 'Secondary site (optional)' })).not.toHaveAttribute('aria-required');
        expect(screen.getByRole('group', { name: 'Extra topics (optional)' })).toBeInTheDocument();
        expect(within(container).getByRole('group', { name: 'Attendance (required)' })).toBeInTheDocument();
        expect(container.querySelector('label[for="dt-opt-date"]')).toHaveTextContent('Follow-up (optional)');
        expect(container.querySelector('label[for="fu-opt"]')).toHaveTextContent('Attachment (optional)');
        expect(screen.getByRole('radiogroup', { name: 'Confidence' })).toHaveAttribute('aria-required', 'true');
        expect(container.querySelector('#rat-req-label, [id$="label"]')).not.toBeNull();
    });

    it('the marker is its own span so it can take the subtle text color, still plain text', () => {
        const { container } = render(<LabelMarker marker="optional" />);
        const span = container.querySelector('.plus-field-marker');
        expect(span).toHaveTextContent('(optional)');
        expect(span.querySelector('svg, i')).toBeNull();
        const scss = readFileSync(join(__dirname, '_internal/FieldFrame.scss'), 'utf8');
        expect(scss).toMatch(/\.plus-field-marker\s*\{[^}]*color:\s*var\(--ds-text-subtle\)/);
        expect(render(<LabelMarker />).container).toBeEmptyDOMElement();
    });

    it('one helper builds the marker: no component rebuilds the (required)/(optional) text', () => {
        const walk = (dir) => readdirSync(dir).flatMap((f) => {
            const full = join(dir, f);
            return statSync(full).isDirectory() ? walk(full) : [full];
        });
        const offenders = walk(__dirname)
            .filter((f) => /\.jsx?$/.test(f) && !/(stories|test)\./.test(f) && !f.endsWith('_internal/FieldFrame.jsx'))
            .filter((f) => /\(\$\{\w*[mM]arker\w*\}\)/.test(readFileSync(f, 'utf8')));
        expect(offenders).toEqual([]);
    });

    it('a visible (required) is hidden from assistive tech when aria-required already says it; (optional) stays announced', () => {
        const { container } = render(
            <div>
                <TextField id="a1" label="Email" isRequired labelMarker="required" />
                <Checkbox id="a2" label="Agree" isRequired labelMarker="required" />
                <FileUpload id="a3" label="Worksheet" isRequired labelMarker="required" />
                <DateTimePicker id="a4" label="When" isRequired labelMarker="required" />
                <Rating id="a5" label="Rate" value={0} isRequired labelMarker="required" />
                <TextField id="a6" label="Notes" labelMarker="optional" />
                <TextField id="a7" label="Name" labelMarker="required" />
            </div>
        );
        for (const id of ['a1', 'a2', 'a3', 'a4', 'a5']) {
            const marker = container.querySelector(`[for^="${id}"] .plus-field-marker, #${id}-label .plus-field-marker, label[for="${id}"] .plus-field-marker, [id^="${id}"] .plus-field-marker`);
            expect(marker, id).not.toBeNull();
            expect(marker).toHaveAttribute('aria-hidden', 'true');
        }
        for (const name of ['Email', 'Agree']) {
            const el = screen.getByRole(name === 'Agree' ? 'checkbox' : 'textbox', { name });
            expect(el.getAttribute('aria-required')).toBe('true');
        }
        expect(screen.getByRole('textbox', { name: 'Notes (optional)' })).toBeInTheDocument();
        // aria-required is not set, so the visible word is the only signal and stays announced.
        expect(screen.getByRole('textbox', { name: 'Name (required)' })).toBeInTheDocument();
    });
});
