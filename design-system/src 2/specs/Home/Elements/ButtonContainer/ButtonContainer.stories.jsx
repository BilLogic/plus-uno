import React from 'react';
import { ButtonContainer } from './ButtonContainer';

export default {
    title: 'Specs/Home/Elements/ButtonContainer',
    component: ButtonContainer,
    parameters: {
        layout: 'centered',
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <ButtonContainer enabled={true} />
        <ButtonContainer enabled={false} />
    </div>
);

