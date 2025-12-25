import React, { useState } from 'react';
import InputGroup from './InputGroup';

export default {
    title: 'Forms/Input Group/Subcomponents',
};

// Checkbox Component
const CheckboxComponent = () => {
    const [checked1, setChecked1] = useState(true);
    const [checked2, setChecked2] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <InputGroup.Checkbox checked={checked1} onChange={(e) => setChecked1(e.target.checked)} />
                <span className="body2-txt">Checked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <InputGroup.Checkbox checked={checked2} onChange={(e) => setChecked2(e.target.checked)} />
                <span className="body2-txt">Unchecked</span>
            </div>
        </div>
    );
};

// Radio Component
const RadioComponent = () => {
    const [selected, setSelected] = useState('option1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <InputGroup.Radio 
                    checked={selected === 'option1'} 
                    onChange={() => setSelected('option1')} 
                />
                <span className="body2-txt">Selected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <InputGroup.Radio 
                    checked={selected === 'option2'} 
                    onChange={() => setSelected('option2')} 
                />
                <span className="body2-txt">Unselected</span>
            </div>
        </div>
    );
};

// Icon Component
const IconComponent = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <InputGroup.Icon />
            <span className="body2-txt">Plus Icon</span>
        </div>
    );
};

// Text Component
const TextComponent = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <InputGroup.Text>Text</InputGroup.Text>
            <span className="body2-txt">Text Addon</span>
        </div>
    );
};

// Button Component
const ButtonComponent = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <InputGroup.Button onClick={() => alert('Button clicked')}>
                Button
            </InputGroup.Button>
            <span className="body2-txt">Button Addon</span>
        </div>
    );
};

// Dropdown Component
const DropdownComponent = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <InputGroup.Dropdown onClick={() => alert('Dropdown clicked')}>
                Dropdown
            </InputGroup.Dropdown>
            <span className="body2-txt">Dropdown Addon</span>
        </div>
    );
};

// Size Variants
const SizeVariants = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Small</h6>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <InputGroup.Checkbox size="small" checked />
                    <InputGroup.Radio size="small" checked />
                    <InputGroup.Icon size="small" />
                    <InputGroup.Text size="small">Text</InputGroup.Text>
                    <InputGroup.Button size="small">Button</InputGroup.Button>
                    <InputGroup.Dropdown size="small">Dropdown</InputGroup.Dropdown>
                </div>
            </div>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Medium (Default)</h6>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <InputGroup.Checkbox size="medium" checked />
                    <InputGroup.Radio size="medium" checked />
                    <InputGroup.Icon size="medium" />
                    <InputGroup.Text size="medium">Text</InputGroup.Text>
                    <InputGroup.Button size="medium">Button</InputGroup.Button>
                    <InputGroup.Dropdown size="medium">Dropdown</InputGroup.Dropdown>
                </div>
            </div>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Large</h6>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <InputGroup.Checkbox size="large" checked />
                    <InputGroup.Radio size="large" checked />
                    <InputGroup.Icon size="large" />
                    <InputGroup.Text size="large">Text</InputGroup.Text>
                    <InputGroup.Button size="large">Button</InputGroup.Button>
                    <InputGroup.Dropdown size="large">Dropdown</InputGroup.Dropdown>
                </div>
            </div>
        </div>
    );
};

export const Checkbox = () => (
    <div className="p-4">
        <CheckboxComponent />
    </div>
);

export const Radio = () => (
    <div className="p-4">
        <RadioComponent />
    </div>
);

export const Icon = () => (
    <div className="p-4">
        <IconComponent />
    </div>
);

export const Text = () => (
    <div className="p-4">
        <TextComponent />
    </div>
);

export const Button = () => (
    <div className="p-4">
        <ButtonComponent />
    </div>
);

export const Dropdown = () => (
    <div className="p-4">
        <DropdownComponent />
    </div>
);

export const Sizes = () => (
    <div className="p-4">
        <SizeVariants />
    </div>
);

