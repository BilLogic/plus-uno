import React, { useState } from 'react';

import { Fieldset, RadioGroup, Select, TextField } from '@/components';
import { FormFields, FILLED } from '../../../patterns/Form/formDemo.jsx';

/**
 * The Forms pattern's examples. The four hosts, the blocked submit, the server
 * refusal, the sending button and leaving with edits are the Form template's
 * demos (formDemo.jsx), reused so the pattern and the template show one thing.
 * What is new here: required and optional marks, help in a caption, and the
 * bound inputs.
 *
 *   Marks         the fields with their required marks and their captions
 *   BoundInputs   a control that cannot be wrong, in place of a free one
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** The fields as the person meets them: Student and Site are required, Notes says it is optional. */
export const Marks = () => {
    const [values, setValues] = useState(FILLED);
    return (
        <div style={{ padding: 'var(--page-pad)', maxInlineSize: 'calc(var(--card-min-width-lg))' }}>
            <FormFields values={values} onChange={setValues} />
        </div>
    );
};

const GRADES = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

/** Up to five choices are a radio group that starts unanswered; six or more are a select. */
export const BoundInputs = () => {
    const [format, setFormat] = useState(null);
    const [grade, setGrade] = useState(null);
    return (
        <div style={{ padding: 'var(--page-pad)', maxInlineSize: 'calc(var(--card-min-width-lg))' }}>
            <Fieldset legend="Session">
                <RadioGroup legend="Format" isRequired options={['In person', 'Video', 'Phone']} value={format} onChange={setFormat} />
                <Select label="Grade" isRequired options={GRADES.map((g) => ({ value: g, label: g }))} value={grade} onChange={setGrade} />
                <TextField label="Notes (optional)" value="" onChange={() => {}} />
            </Fieldset>
        </div>
    );
};
