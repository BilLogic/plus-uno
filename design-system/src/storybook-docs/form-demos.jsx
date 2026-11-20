import React from 'react';
import PropTypes from 'prop-types';
// Docs scaffolding, not product code: the demos draw the fields' own label and caption rows.
import { FieldCaption, FieldLabel } from '@/lib/field';

/**
 * Label and Caption demos for the Form page.
 *
 * Both draw on the field's own label and caption rows, so a demo shows the
 * same type, color and icon a real field shows, apart from a control.
 */

/** The caption tone each demo state draws. */
const TONE_FOR_STATE = {
    default: 'help',
    success: 'success',
    danger: 'invalid',
    warning: 'warning',
};

/**
 * A field label with an optional minority marker.
 *
 * @param {object} props
 * @param {string} [props.text] Label copy.
 * @param {'required'|'optional'} [props.labelMarker] Minority marker after the label.
 * @param {string} [props.htmlFor] `id` of the control this label names.
 */
export const Label = ({ text = 'Label', labelMarker, htmlFor }) => (
    <FieldLabel htmlFor={htmlFor} labelMarker={labelMarker}>{text}</FieldLabel>
);

Label.propTypes = {
    text: PropTypes.string,
    labelMarker: PropTypes.oneOf(['required', 'optional']),
    htmlFor: PropTypes.string,
};

/**
 * The caption under a field, in the tone its state names.
 *
 * @param {object} props
 * @param {string} [props.text] Caption copy.
 * @param {'default'|'success'|'danger'|'warning'} [props.state]
 */
export const Caption = ({ text = 'Caption', state = 'default' }) => (
    <FieldCaption message={text} tone={TONE_FOR_STATE[state] ?? 'help'} />
);

Caption.propTypes = {
    text: PropTypes.string,
    state: PropTypes.oneOf(Object.keys(TONE_FOR_STATE)),
};
