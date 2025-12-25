import React, { useState } from 'react';
import Select from './Select';

export default {
    title: 'Forms/Select',
    component: Select,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Enhanced Select component with custom dropdown popup (not native select).
                
**Features:**
- Single select mode with radio-style indicators
- Multi-select mode with checkbox-style indicators
- Dismissible badges for selected values
- Search/filter functionality
- Add new values option (creatable)
- Size variants: small, medium, large`
            }
        }
    },
    argTypes: {
        mode: {
            control: 'select',
            options: ['single', 'multi'],
            description: 'Selection mode'
        },
        searchable: {
            control: 'boolean',
            description: 'Enable search filter'
        },
        creatable: {
            control: 'boolean',
            description: 'Allow adding new values'
        },
        displayMode: {
            control: 'select',
            options: ['badges', 'text'],
            description: 'How to display selected values (multi-select only)'
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant'
        }
    }
};

const sampleOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'elderberry', label: 'Elderberry' },
    { value: 'fig', label: 'Fig' },
    { value: 'grape', label: 'Grape' },
    { value: 'honeydew', label: 'Honeydew' }
];

// ========== OVERVIEW ==========
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '400px' }}>
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Single Select</h6>
            <Select
                options={sampleOptions}
                placeholder="Select a fruit..."
            />
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Multi-Select with Badges</h6>
            <Select
                mode="multi"
                options={sampleOptions}
                placeholder="Select fruits..."
                defaultValue={['apple', 'cherry']}
            />
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Searchable Select</h6>
            <Select
                options={sampleOptions}
                placeholder="Search and select..."
                searchable
            />
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Creatable Select</h6>
            <Select
                mode="multi"
                options={sampleOptions}
                placeholder="Add or select..."
                searchable
                creatable
            />
        </section>
    </div>
);

// ========== SINGLE SELECT ==========
export const SingleSelect = () => {
    const [value, setValue] = useState('');

    return (
        <div style={{ maxWidth: '400px' }}>
            <Select
                options={sampleOptions}
                value={value}
                onChange={setValue}
                placeholder="Select a fruit..."
            />
            <p style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)' }}>
                Selected: {value || 'None'}
            </p>
        </div>
    );
};

// ========== MULTI SELECT ==========
export const MultiSelect = () => {
    const [values, setValues] = useState(['apple']);

    return (
        <div style={{ maxWidth: '400px' }}>
            <Select
                mode="multi"
                options={sampleOptions}
                value={values}
                onChange={setValues}
                placeholder="Select fruits..."
            />
            <p style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)' }}>
                Selected: {values.length > 0 ? values.join(', ') : 'None'}
            </p>
        </div>
    );
};

// ========== SEARCHABLE ==========
export const Searchable = () => (
    <div style={{ maxWidth: '400px' }}>
        <Select
            options={sampleOptions}
            placeholder="Type to search..."
            searchable
        />
    </div>
);

// ========== CREATABLE ==========
export const Creatable = () => {
    const [values, setValues] = useState([]);
    const [options, setOptions] = useState(sampleOptions);

    const handleChange = (newValues) => {
        // Add any new values to options
        newValues.forEach(val => {
            if (!options.find(o => o.value === val)) {
                setOptions(prev => [...prev, { value: val, label: val }]);
            }
        });
        setValues(newValues);
    };

    return (
        <div style={{ maxWidth: '400px' }}>
            <p className="body3-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Type a fruit name that doesn't exist and press the "Add" option to create it.
            </p>
            <Select
                mode="multi"
                options={options}
                value={values}
                onChange={handleChange}
                placeholder="Add or select fruits..."
                searchable
                creatable
            />
        </div>
    );
};

// ========== SIZE VARIANTS ==========
export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
        <section>
            <p className="body3-txt" style={{ marginBottom: '8px' }}>Small</p>
            <Select
                size="small"
                options={sampleOptions}
                placeholder="Small select..."
            />
        </section>
        <section>
            <p className="body3-txt" style={{ marginBottom: '8px' }}>Medium (default)</p>
            <Select
                size="medium"
                options={sampleOptions}
                placeholder="Medium select..."
            />
        </section>
        <section>
            <p className="body3-txt" style={{ marginBottom: '8px' }}>Large</p>
            <Select
                size="large"
                options={sampleOptions}
                placeholder="Large select..."
            />
        </section>
    </div>
);

// ========== DISPLAY MODES ==========
export const DisplayModes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
        <section>
            <p className="body3-txt" style={{ marginBottom: '8px' }}>Display as Badges (default)</p>
            <Select
                mode="multi"
                displayMode="badges"
                options={sampleOptions}
                defaultValue={['apple', 'banana', 'cherry']}
            />
        </section>
        <section>
            <p className="body3-txt" style={{ marginBottom: '8px' }}>Display as Text</p>
            <Select
                mode="multi"
                displayMode="text"
                options={sampleOptions}
                defaultValue={['apple', 'banana', 'cherry']}
            />
        </section>
    </div>
);

// ========== INTERACTIVE ==========
export const Interactive = (args) => {
    const [value, setValue] = useState(args.mode === 'multi' ? [] : '');

    return (
        <div style={{ maxWidth: '400px' }}>
            <Select
                {...args}
                options={sampleOptions}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};

Interactive.args = {
    mode: 'single',
    placeholder: 'Select...',
    searchable: false,
    creatable: false,
    displayMode: 'badges',
    size: 'medium',
    disabled: false
};
