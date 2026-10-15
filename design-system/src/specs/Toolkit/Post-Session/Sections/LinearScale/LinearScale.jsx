import React from 'react';
import PropTypes from 'prop-types';
import { ChoiceGroup } from '@/components/forms-and-inputs';
import './LinearScale.scss';

const SCALE_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

/**
 * Five-point linear scale (Figma Sections · Linear Scale `10819:11602`).
 * Post-Session shell around a Foundations `ChoiceGroup`: inline radios with
 * the two scale ends as its leading and trailing text.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.legend] - The question. Names the scale.
 * @param {boolean} [props.required=false]
 * @param {number} [props.value=0] - 0 is unanswered
 * @param {(value: number) => void} [props.onChange]
 * @param {string} [props.name='linear-scale']
 * @param {string} [props.lowLabel='I struggled to find my footing.']
 * @param {string} [props.highLabel='I nailed it!']
 */
const LinearScale = ({
    legend,
    required = false,
    value = 0,
    onChange,
    name = 'linear-scale',
    lowLabel = 'I struggled to find my footing.',
    highLabel = 'I nailed it!',
}) => (
    <ChoiceGroup
        id={name}
        name={name}
        className="post-session-linear-scale"
        legend={legend}
        aria-label={legend ? undefined : `${lowLabel} to ${highLabel}`}
        required={required}
        orientation="inline"
        leadingText={lowLabel}
        trailingText={highLabel}
        options={SCALE_OPTIONS}
        value={value || null}
        onChange={(next) => onChange?.(next)}
    />
);

LinearScale.propTypes = {
    legend: PropTypes.node,
    required: PropTypes.bool,
    value: PropTypes.number,
    onChange: PropTypes.func,
    name: PropTypes.string,
    lowLabel: PropTypes.string,
    highLabel: PropTypes.string,
};

export default LinearScale;
