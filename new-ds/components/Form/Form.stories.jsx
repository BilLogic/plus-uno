import React, { useState } from 'react';
import Textarea from './Textarea';
import Select from './Select';
import SelectMultiple from './SelectMultiple';
import RangeInput from './RangeInput';

export default {
    title: 'Components/Form',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Form components collection.'
            }
        }
    }
};

export const TextareaStory = () => <Textarea placeholder="Enter text..." />;
export const SelectStory = () => (
    <Select
        placeholder="Choose..."
        options={[
            { value: '1', text: 'Option 1' },
            { value: '2', text: 'Option 2' }
        ]}
    />
);
export const RangeInputStory = () => (
    <RangeInput min={0} max={100} defaultValue={50} />
);

export const SelectMultipleStory = () => {
    const [selected, setSelected] = useState([]);
    return (
        <div style={{ maxWidth: '300px' }}>
            <SelectMultiple
                options={[
                    { value: 'opt1', text: 'Option 1' },
                    { value: 'opt2', text: 'Option 2' },
                    { value: 'opt3', text: 'Option 3' }
                ]}
                selectedValues={selected}
                onChange={({ allSelected }) => setSelected(allSelected)}
            />
            <p className="mt-2">Selected: {selected.join(', ')}</p>
        </div>
    );
};
