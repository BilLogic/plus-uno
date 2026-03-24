import React from 'react';
import ListGroup from './ListGroup';
import { Badge } from '@/components/Badge';

export default {
    title: 'Components/ListGroup',
    component: ListGroup,
    tags: ['!dev'],
    subcomponents: { 'ListGroup.Item': ListGroup.Item },
    argTypes: { ListGroupItem: ListGroup.Item },
    parameters: {
        docs: {
            description: {
                component: 'List group component for displaying a series of content items. Built on Bootstrap list-group pattern with PLUS design token customizations.'
            }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: '32px' };

function ListGroupContentPlainDemo() {
    return (
        <section>
            <h5>Plain list</h5>
            <ListGroup>
                <ListGroup.Item>List item 1</ListGroup.Item>
                <ListGroup.Item>List item 2</ListGroup.Item>
                <ListGroup.Item>List item 3</ListGroup.Item>
            </ListGroup>
        </section>
    );
}

function ListGroupContentActionableDemo() {
    return (
        <section>
            <h5>Actionable</h5>
            <ListGroup>
                <ListGroup.Item action href="#">Link item</ListGroup.Item>
                <ListGroup.Item action onClick={() => console.log('clicked')}>
                    Button item
                </ListGroup.Item>
            </ListGroup>
        </section>
    );
}

function ListGroupContentBadgesDemo() {
    return (
        <section>
            <h5>With badges</h5>
            <ListGroup>
                <ListGroup.Item>
                    Item with badge
                    <Badge counter="14" style="primary" size="b1" />
                </ListGroup.Item>
                <ListGroup.Item>
                    Item with badge
                    <Badge counter="2" style="primary" size="b1" />
                </ListGroup.Item>
            </ListGroup>
        </section>
    );
}

function ListGroupInteractionStatesDemo() {
    return (
        <section>
            <h5>States</h5>
            <ListGroup>
                <ListGroup.Item>Normal item</ListGroup.Item>
                <ListGroup.Item active>Active item</ListGroup.Item>
                <ListGroup.Item disabled>Disabled item</ListGroup.Item>
            </ListGroup>
        </section>
    );
}

function ListGroupVariantsDemo() {
    return (
        <section>
            <h5>Semantic styles</h5>
            <ListGroup>
                <ListGroup.Item style="primary">Primary item</ListGroup.Item>
                <ListGroup.Item style="secondary">Secondary item</ListGroup.Item>
                <ListGroup.Item style="success">Success item</ListGroup.Item>
                <ListGroup.Item style="danger">Danger item</ListGroup.Item>
                <ListGroup.Item style="warning">Warning item</ListGroup.Item>
                <ListGroup.Item style="info">Info item</ListGroup.Item>
            </ListGroup>
        </section>
    );
}

function ListGroupLayoutFlushDemo() {
    return (
        <section>
            <h5>Flush</h5>
            <ListGroup flush>
                <ListGroup.Item>Flush item 1</ListGroup.Item>
                <ListGroup.Item>Flush item 2</ListGroup.Item>
                <ListGroup.Item>Flush item 3</ListGroup.Item>
            </ListGroup>
        </section>
    );
}

function ListGroupLayoutHorizontalDemo() {
    return (
        <section>
            <h5>Horizontal</h5>
            <ListGroup horizontal>
                <ListGroup.Item>First</ListGroup.Item>
                <ListGroup.Item>Second</ListGroup.Item>
                <ListGroup.Item>Third</ListGroup.Item>
            </ListGroup>
        </section>
    );
}

export const Content = () => (
    <div style={col}>
        <ListGroupContentPlainDemo />
        <ListGroupContentActionableDemo />
        <ListGroupContentBadgesDemo />
    </div>
);

export const InteractionStates = () => (
    <div style={col}>
        <ListGroupInteractionStatesDemo />
    </div>
);

export const Styles = () => (
    <div style={col}>
        <ListGroupVariantsDemo />
    </div>
);

export const Layout = () => (
    <div style={col}>
        <ListGroupLayoutFlushDemo />
        <ListGroupLayoutHorizontalDemo />
    </div>
);

export const Overview = () => (
    <div style={col}>
        <ListGroupContentPlainDemo />
        <ListGroupInteractionStatesDemo />
        <ListGroupVariantsDemo />
        <ListGroupContentActionableDemo />
        <ListGroupLayoutFlushDemo />
        <ListGroupContentBadgesDemo />
        <ListGroupLayoutHorizontalDemo />
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
    as: 'div'
};
Interactive.argTypes = {
    children: {
        table: { disable: true }
    },
    flush: {
        control: 'boolean',
        description: 'Remove borders and rounded corners to render list group items edge-to-edge',
        table: { category: 'Design' }
    },
    horizontal: {
        control: 'boolean',
        description: 'Change the layout of list group items from vertical to horizontal',
        table: { category: 'Design' }
    },
    as: {
        control: 'select',
        options: ['div', 'ul', 'ol'],
        description: 'The underlying HTML element to use for the ListGroup',
        table: { category: 'Behavior' }
    },
    className: {
        control: 'text',
        description: 'Check class propagation',
        table: { category: 'System' }
    }
};
