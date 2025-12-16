import React, { useState } from 'react';
import Chip from '@/components/Chip';

export default {
    title: 'Components/Chip',
    component: Chip,
    tags: ['autodocs'],
    argTypes: {
        text: { control: 'text' },
        style: {
            control: 'select',
            options: ['default', 'primary', 'secondary', 'info', 'warning', 'error', 'success'],
        },
        size: {
            control: 'select',
            options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
        },
    },
};

export const Default = (args) => <Chip {...args} />;
Default.args = {
    text: 'Chip',
    style: 'default',
    size: 'b1',
    onRemove: () => alert('Remove clicked'),
};

export const AllStyles = () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['default', 'primary', 'secondary', 'info', 'warning', 'error', 'success'].map(style => (
            <Chip key={style} text={style} style={style} />
        ))}
    </div>
);

export const InteractiveExample = () => {
    const [chips, setChips] = useState([
        { id: 1, text: 'React' },
        { id: 2, text: 'Vue' },
        { id: 3, text: 'Angular' },
    ]);

    const handleRemove = (id) => {
        setChips(chips.filter(c => c.id !== id));
    };

    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            {chips.map(chip => (
                <Chip
                    key={chip.id}
                    text={chip.text}
                    style="primary"
                    onRemove={() => handleRemove(chip.id)}
                />
            ))}
            {chips.length === 0 && <span>All chips removed! Refresh to reset.</span>}
        </div>
    );
};
