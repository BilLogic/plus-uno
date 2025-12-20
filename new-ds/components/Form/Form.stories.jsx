import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import TagInput from './TagInput';
import Rating from './Rating';
import RadioButtonGroup from './RadioButtonGroup';
import DateAndTimePicker from '../../forms/DateAndTimePicker';

export default {
    title: 'Form',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Form components collection.'
            }
        }
    }
};

export const LabelAndCaption = () => {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px' }}>
            {/* Label Section */}
            <div>
                <h2 className="h2" style={{ marginBottom: '16px' }}>Label</h2>
                <Form.Label>
                    Label <span style={{ color: 'var(--color-danger)' }}>*</span>
                </Form.Label>
            </div>

            {/* Caption Section */}
            <div>
                <h2 className="h2" style={{ marginBottom: '16px' }}>Caption</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Medium (Default) */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Medium (Default)</h3>
                        <TagInput
                            id="tag-input-medium"
                            tags={tags1}
                            onChange={setTags1}
                            size="medium"
                        />
                    </div>

                    {/* Small */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Small</h3>
                        <TagInput
                            id="tag-input-small"
                            tags={tags2}
                            onChange={setTags2}
                            size="small"
                        />
                    </div>

                    {/* Large */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Large</h3>
                        <TagInput
                            id="tag-input-large"
                            tags={tags3}
                            onChange={setTags3}
                            size="large"
                        />
                    </div>

                    {/* Disabled */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Disabled</h3>
                        <TagInput
                            id="tag-input-disabled"
                            tags={[{ text: 'caption', color: 'default' }]}
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Rating Section */}
            <div>
                <h2 className="h2" style={{ marginBottom: '16px' }}>Rating</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Comments Variant */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Comments Variant</h3>
                        <Rating
                            id="rating-comments"
                            value={3}
                            variant="comments"
                        />
                    </div>

                    {/* Numeric Variant */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Numeric Variant</h3>
                        <Rating
                            id="rating-numeric"
                            value={3}
                            variant="numeric"
                        />
                    </div>

                    {/* With Label */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>With Label</h3>
                        <Rating
                            id="rating-labeled"
                            label="Rating"
                            required
                            value={3}
                            variant="comments"
                        />
                    </div>

                    {/* Disabled */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Disabled</h3>
                        <Rating
                            id="rating-disabled"
                            value={3}
                            variant="comments"
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Radio Button Group Section */}
            <div>
                <h2 className="h2" style={{ marginBottom: '16px' }}>Radio Button Group</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Default */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Default</h3>
                        <RadioButtonGroup
                            id="radio-group-default"
                            name="radio-group-default"
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={[
                                { value: 'option1', label: 'Text' },
                                { value: 'option2', label: 'Text' },
                                { value: 'option3', label: 'Text' }
                            ]}
                            defaultValue="option2"
                        />
                    </div>

                    {/* With Label */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>With Label</h3>
                        <RadioButtonGroup
                            id="radio-group-labeled"
                            name="radio-group-labeled"
                            label="Rating"
                            required
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={[
                                { value: 'option1', label: 'Text' },
                                { value: 'option2', label: 'Text' },
                                { value: 'option3', label: 'Text' }
                            ]}
                            defaultValue="option2"
                        />
                    </div>

                    {/* Disabled */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Disabled</h3>
                        <RadioButtonGroup
                            id="radio-group-disabled"
                            name="radio-group-disabled"
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={[
                                { value: 'option1', label: 'Text' },
                                { value: 'option2', label: 'Text' },
                                { value: 'option3', label: 'Text' }
                            ]}
                            value="option2"
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Date and Time Picker Section */}
            <div>
                <h2 className="h2" style={{ marginBottom: '16px' }}>Date and Time Picker</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Default */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Default</h3>
                        <DateAndTimePicker
                            id="datetime-default"
                            label="Month"
                            required
                        />
                    </div>

                    {/* Focus */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Focus</h3>
                        <DateAndTimePicker
                            id="datetime-focus"
                            label="Month"
                            required
                        />
                    </div>

                    {/* Disabled */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Disabled</h3>
                        <DateAndTimePicker
                            id="datetime-disabled"
                            label="Month"
                            required
                            disabled
                        />
                    </div>

                    {/* Error */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Error</h3>
                        <DateAndTimePicker
                            id="datetime-error"
                            label="Month"
                            required
                            validation="invalid"
                            validationMessage="Validation message"
                        />
                    </div>

                    {/* Success */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Success</h3>
                        <DateAndTimePicker
                            id="datetime-success"
                            label="Month"
                            required
                            validation="success"
                            validationMessage="Validation message"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
