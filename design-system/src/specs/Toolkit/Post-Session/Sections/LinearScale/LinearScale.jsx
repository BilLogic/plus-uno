import React from 'react';
import PropTypes from 'prop-types';
import { Scale } from '@/components/forms-and-inputs';
import './LinearScale.scss';

const SCALE_VALUES = [1, 2, 3, 4, 5];

/**
 * Five-point linear scale (Figma Sections · Linear Scale `10819:11602`).
 * Post-Session shell + Foundations `Scale.Button` radios — not the Foundations Scale organism
 * (that shell uses different padding, gap, and non-wrapping end labels).
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
    <div
        className="post-session-linear-scale"
        role="radiogroup"
        aria-label={`${lowLabel} to ${highLabel}`}
    >
        <div className="post-session-linear-scale__row">
            <div className="post-session-linear-scale__label body2-txt">
                {lowLabel}
            </div>
            <div className="post-session-linear-scale__options">
                {SCALE_VALUES.map((optionValue) => {
                    const optionId = `${name}-option-${optionValue}`;
                    const labelId = `${optionId}-label`;
                    return (
                        <div key={optionValue} className="post-session-linear-scale__option">
                            <div id={labelId} className="post-session-linear-scale__option-label body2-txt">
                                {optionValue}
                            </div>
                            <Scale.Button
                                id={optionId}
                                name={name}
                                value={optionValue}
                                checked={value === optionValue}
                                onChange={() => onChange?.(optionValue)}
                                aria-labelledby={labelId}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="post-session-linear-scale__label body2-txt">
                {highLabel}
            </div>
        </div>
    </div>
);

LinearScale.propTypes = {
    value: PropTypes.number,
    onChange: PropTypes.func,
    name: PropTypes.string,
    lowLabel: PropTypes.string,
    highLabel: PropTypes.string,
};

export default LinearScale;
