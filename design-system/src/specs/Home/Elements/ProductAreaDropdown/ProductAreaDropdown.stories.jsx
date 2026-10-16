import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { ProductAreaDropdown } from './ProductAreaDropdown';

export default {
    title: 'Specs/Home/Elements/Product Area Dropdown',
    tags: ['!dev', '!autodocs'],
    component: ProductAreaDropdown,
    parameters: {
        layout: 'centered',
    },
};

export const Overview = () => {
    const [value, setValue] = useState('');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)', width: '320px', paddingBottom: '240px' }}>
            <ProductAreaDropdown
                value={value}
                onChange={setValue}
            />
            <ProductAreaDropdown
                defaultOpen
                value={value}
                onChange={setValue}
            />
            <p className="body3-txt">Product area: <strong data-testid="applied">{value || 'none'}</strong></p>
        </div>
    );
};

Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [field] = canvas.getAllByRole('combobox', { name: 'Product Area' });

    await userEvent.click(field);
    await userEvent.click(await within(document.body).findByRole('option', { name: 'Toolkit' }));
    await expect(canvas.getByTestId('applied')).toHaveTextContent('toolkit');
    await expect(field).toHaveTextContent('Toolkit');
};
