import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import TagInput from './TagInput';
import ChoiceGrid from './ChoiceGrid';

export default {
    title: 'Forms/Label and Caption',
    component: TagInput,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Label and Caption components for form inputs. Label provides form field labeling with optional required indicator. Caption displays tag items with various color states and sizes.'
            }
        }
    },
    argTypes: {
        tags: {
            control: 'object',
            description: 'Array of tag objects with text and color properties',
            table: { category: 'Content' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the caption component',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the caption component',
            table: { category: 'Behavior' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Label and Caption configurations.
 */
export const Overview = () => {
    const [tags1, setTags1] = useState([
        { text: 'caption', color: 'default' },
        { text: 'caption', color: 'success' },
        { text: 'caption', color: 'danger' },
        { text: 'caption', color: 'warning' },
        { text: 'caption', color: 'default' }
    ]);

    const [tags2, setTags2] = useState([
        { text: 'Small tag', color: 'info' }
    ]);

    const [tags3, setTags3] = useState([
        { text: 'Large tag', color: 'success' },
        { text: 'Large tag', color: 'danger' }
    ]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Label Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Label</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Form label component with optional required indicator (red asterisk).
                </p>
                <Form.Label>
                    Label <span style={{ color: 'var(--color-danger)' }}>*</span>
                </Form.Label>
            </section>

            {/* Caption - Medium (Default) */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Caption - Medium (Default)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Default size caption with multiple tag items showing different color states.
                </p>
                <TagInput
                    id="tag-input-medium"
                    tags={tags1}
                    onChange={setTags1}
                    size="medium"
                />
            </section>

            {/* Caption - Small */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Caption - Small</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Small size variant for compact layouts.
                </p>
                <TagInput
                    id="tag-input-small"
                    tags={tags2}
                    onChange={setTags2}
                    size="small"
                />
            </section>

            {/* Caption - Large */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Caption - Large</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Large size variant for prominent displays.
                </p>
                <TagInput
                    id="tag-input-large"
                    tags={tags3}
                    onChange={setTags3}
                    size="large"
                />
            </section>

            {/* Caption - Disabled */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Caption - Disabled</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled state prevents interaction with the caption component.
                </p>
                <TagInput
                    id="tag-input-disabled"
                    tags={[{ text: 'caption', color: 'default' }]}
                    disabled
                />
            </section>

            {/* Choice Grid Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Choice Grid</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Grid-based selection component supporting both radio buttons and checkboxes.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Radio Grid */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Radio Grid</h3>
                        <ChoiceGrid
                            id="choice-grid-radio-form"
                            name="choice-grid-radio-form"
                            type="radio"
                            rows={[{ id: 'row-1', label: 'Row 1' }]}
                            columns={[
                                { id: 'col-1', label: 'Column 1' },
                                { id: 'col-2', label: 'Column 2' },
                                { id: 'col-3', label: 'Column 3' },
                                { id: 'col-4', label: 'Column 4' }
                            ]}
                            values={{ 'row-1': 'col-2' }}
                            onChange={() => {}}
                        />
                    </div>

                    {/* Checkbox Grid */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Checkbox Grid</h3>
                        <ChoiceGrid
                            id="choice-grid-checkbox-form"
                            name="choice-grid-checkbox-form"
                            type="checkbox"
                            rows={[{ id: 'row-1', label: 'Row 1' }]}
                            columns={[
                                { id: 'col-1', label: 'Column 1' },
                                { id: 'col-2', label: 'Column 2' },
                                { id: 'col-3', label: 'Column 3' },
                                { id: 'col-4', label: 'Column 4' }
                            ]}
                            values={{ 'row-1': { 'col-1': true, 'col-3': true } }}
                            onChange={() => {}}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the Caption attributes in real-time.
 */
export const Interactive = (args) => {
    const [tags, setTags] = useState(args.tags || [
        { text: 'caption', color: args.tags?.[0]?.color || 'default' }
    ]);

    return (
        <div style={{ maxWidth: '600px' }}>
            <TagInput
                id="tag-input-interactive"
                tags={tags}
                onChange={setTags}
                size={args.size}
                disabled={args.disabled}
            />
        </div>
    );
};

Interactive.args = {
    size: 'medium',
    disabled: false,
    tags: [
        { text: 'caption', color: 'default' }
    ]
};
