import React from 'react';
import ListGroup from './ListGroup';
import { Badge } from '@/components/Badge';

export default {
    title: 'Components/ListGroup',
    component: ListGroup,
    subcomponents: { ListGroupItem: ListGroup.Item },
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'List group component for displaying a series of content items. Built on Bootstrap list-group pattern with PLUS design token customizations.'
            }
        }
    }
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
            <h5>Content</h5>
            <ListGroup>
                <ListGroup.Item>List item 1</ListGroup.Item>
                <ListGroup.Item>List item 2</ListGroup.Item>
                <ListGroup.Item>List item 3</ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>States</h5>
            <ListGroup>
                <ListGroup.Item>Normal item</ListGroup.Item>
                <ListGroup.Item active>Active item</ListGroup.Item>
                <ListGroup.Item disabled>Disabled item</ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>Colors</h5>
            <ListGroup>
                <ListGroup.Item style="primary">Primary item</ListGroup.Item>
                <ListGroup.Item style="secondary">Secondary item</ListGroup.Item>
                <ListGroup.Item style="success">Success item</ListGroup.Item>
                <ListGroup.Item style="danger">Danger item</ListGroup.Item>
                <ListGroup.Item style="warning">Warning item</ListGroup.Item>
                <ListGroup.Item style="info">Info item</ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>Actionable (Links & Buttons)</h5>
            <ListGroup>
                <ListGroup.Item action href="#">Link item</ListGroup.Item>
                <ListGroup.Item action onClick={() => console.log('clicked')}>
                    Button item
                </ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>Flush</h5>
            <ListGroup flush>
                <ListGroup.Item>Flush item 1</ListGroup.Item>
                <ListGroup.Item>Flush item 2</ListGroup.Item>
                <ListGroup.Item>Flush item 3</ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>With Badges</h5>
            <ListGroup>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    Item with badge
                    <Badge text="14" style="primary" size="b2" />
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    Item with badge
                    <Badge text="2" style="primary" size="b2" />
                </ListGroup.Item>
            </ListGroup>
        </section>
    </div>
);

export const Interactive = (args) => (
    <ListGroup {...args}>
        <ListGroup.Item>Item 1</ListGroup.Item>
        <ListGroup.Item active>Item 2</ListGroup.Item>
        <ListGroup.Item>Item 3</ListGroup.Item>
    </ListGroup>
);
Interactive.args = {
    flush: false,
    horizontal: false,
};
