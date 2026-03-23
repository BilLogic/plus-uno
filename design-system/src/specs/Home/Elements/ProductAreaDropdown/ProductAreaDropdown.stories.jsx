import React, { useState } from 'react';
import { ProductAreaDropdown } from './ProductAreaDropdown';

export default {
    title: 'Specs/Home/Elements/ProductAreaDropdown',
    component: ProductAreaDropdown,
    parameters: {
        layout: 'centered',
    },
};

export const Overview = () => {
    const [value, setValue] = useState(null);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <ProductAreaDropdown 
                defaultOpen={false}
                value={value}
                onChange={setValue}
            />
            <ProductAreaDropdown 
                defaultOpen={true}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};

