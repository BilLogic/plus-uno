import React from 'react';

export const Canvas = ({ children, of }) => (
    <div data-testid="mock-canvas">
        {of?.render ? <of.render /> : children}
    </div>
);

export const Story = ({ of }) => (of?.render ? <of.render /> : null);

export const Meta = () => null;

export const Title = () => null;
