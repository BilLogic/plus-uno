import React from 'react';
import InputGroup from './InputGroup';
import { Form, Button } from 'react-bootstrap';

export default {
    title: 'Components/InputGroup',
    component: InputGroup,
    tags: ['autodocs']
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
        <InputGroup prepend="@" placeholder="Username">
            <Form.Control placeholder="Username" />
        </InputGroup>

        <InputGroup append=".com">
            <Form.Control placeholder="Recipient's username" />
        </InputGroup>

        <InputGroup prepend="$" append=".00">
            <Form.Control placeholder="Amount" />
        </InputGroup>

        <InputGroup
            prepend={<Button variant="outline-secondary">Button</Button>}
        >
            <Form.Control placeholder="Button addon" />
        </InputGroup>
    </div>
);
