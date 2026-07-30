import React from 'react';
import PropTypes from 'prop-types';
import { Scale } from '@/components/forms-and-inputs';
import './LinearScale.scss';

const SCALE_OPTIONS = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
];

/**
 * Five-point linear scale (Figma Sections · Linear Scale `10819:11602`).
 * Thin Post-Session organism over Foundations Scale — shell/token overrides in SCSS.
 *
 * @param {object} props
 * @param {number} [props.value=0]
 * @param {(value: number) => void} [props.onChange]
 * @param {string} [props.name='linear-scale']
 * @param {string} [props.lowLabel='I struggled to find my footing.']
 * @param {string} [props.highLabel='I nailed it!']
 */
const LinearScale = ({
    value = 0,
    onChange,
    name = 'linear-scale',
    lowLabel = 'I struggled to find my footing.',
    highLabel = 'I nailed it!',
}) => (
    <Scale
        id={name}
        name={name}
        className="post-session-linear-scale"
        lowestLabel={lowLabel}
        highestLabel={highLabel}
        options={SCALE_OPTIONS}
        value={value > 0 ? value : null}
        onChange={(next) => onChange?.(Number(next))}
        aria-label="Self reflection scale"
    />
);

LinearScale.propTypes = {
    value: PropTypes.number,
    onChange: PropTypes.func,
    name: PropTypes.string,
    lowLabel: PropTypes.string,
    highLabel: PropTypes.string,
};

export default LinearScale;
