import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FieldLabel } from './_internal/FieldFrame';
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
            <FieldLabel htmlFor="f1" marker="optional" info="Roster name">Notes</FieldLabel>
        );
        expect(container.querySelector('label')).toHaveTextContent(/^Notes \(optional\)$/);
        expect(screen.getByRole('button', { name: 'About Notes' })).toBeInTheDocument();

        rerender(
            <FieldLabel htmlFor="f1" marker="required" info="Roster name">Student</FieldLabel>
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
                <TagInput id="tags" label="Tags" options={['Math']} required />
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
                <Range id="rng-opt" label="Goal minutes" labelMarker="optional" />
            </div>
        );

        expect(container.textContent).not.toContain('*');
        expect(screen.getByRole('textbox', { name: 'Notes (optional)' })).not.toHaveAttribute('aria-required');
        expect(screen.getByRole('textbox', { name: 'Email (required)' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('combobox', { name: 'Secondary site (optional)' })).not.toHaveAttribute('aria-required');
        expect(screen.getByRole('group', { name: 'Extra topics (optional)' })).toBeInTheDocument();
        expect(within(container).getByRole('group', { name: 'Attendance (required)' })).toBeInTheDocument();
        expect(container.querySelector('label[for="dt-opt-date"]')).toHaveTextContent('Follow-up (optional)');
        expect(container.querySelector('label[for="fu-opt"]')).toHaveTextContent('Attachment (optional)');
        expect(screen.getByRole('radiogroup', { name: 'Confidence (required)' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('slider', { name: 'Goal minutes (optional)' })).toBeInTheDocument();
    });
});
