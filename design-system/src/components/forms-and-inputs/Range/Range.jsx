import React from 'react';
import PropTypes from 'prop-types';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import useFieldId from '../useFieldId';
import FieldFrame, { FieldLabel } from '../_internal/FieldFrame';
import './Range.scss';

/**
 * Range — slider over a numeric span.
 *
 * A range input carries its value, never its meaning: "49" says nothing about
 * what is being set. `label` is the only thing that names it, so it takes the
 * same pair as `Input` — `label` for the text, `showLabel={false}` to hide that
 * text without taking the name away (#213).
 *
 * Built on Base UI's Slider, wrapped in `FieldFrame` (A7) for the disabled
 * fade. Base UI's Slider has no DOM-query label lookup the way Checkbox and
 * Radio do — `Slider.Thumb`'s accessible name only ever comes from an
 * explicit `aria-label`/`aria-labelledby` or an ambient `Field.Label`
 * registration — so the label here points at the thumb directly via
 * `aria-labelledby` on `Slider.Root`, which `Slider.Root` forwards to every
 * `Slider.Thumb` beneath it.
 */
const Range = ({
    id,
    name,
    label,
    showLabel = true,
    min = 0,
    max = 100,
    value,
    defaultValue,
    step = 1,
    isDisabled = false,
    /** The dot and bar, in px (`8` · `12` · `16`); the track between them follows at `4` · `6` · `8`. Unset keeps the default rendering. */
    size,
    onChange,
    className = '',
    style,
    ...props
}) => {
    const fieldId = useFieldId(id);
    const labelId = label ? `${fieldId}-label` : undefined;

    /** Reports the new value as a number, then the event it came from. */
    const handleValueChange = (next, eventDetails) => {
        onChange?.(next, eventDetails.event);
    };

    const rangeClasses = [
        'plus-form-range',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className="plus-form-range-wrapper" data-size={size}>
            <FieldFrame disabled={isDisabled}>
                <div className="plus-form-range-row">
                    {label && (
                        <FieldLabel
                            id={labelId}
                            hidden={!showLabel}
                            className="plus-form-range-label"
                        >
                            {label}
                        </FieldLabel>
                    )}
                    <BaseSlider.Root
                        id={fieldId}
                        name={name}
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        defaultValue={defaultValue}
                        disabled={isDisabled}
                        onValueChange={handleValueChange}
                        aria-labelledby={labelId}
                        aria-disabled={isDisabled || undefined}
                        className={rangeClasses}
                        style={style}
                        {...props}
                    >
                        <BaseSlider.Control className="plus-form-range-control">
                            <BaseSlider.Track className="plus-form-range-track">
                                <BaseSlider.Indicator className="plus-form-range-indicator" />
                                <BaseSlider.Thumb className="plus-form-range-thumb" />
                            </BaseSlider.Track>
                        </BaseSlider.Control>
                    </BaseSlider.Root>
                </div>
            </FieldFrame>
        </div>
    );
};

Range.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    /** Text that names the slider. Without it the slider has no accessible name. */
    label: PropTypes.node,
    /** Render the label visually hidden rather than visible. It still names the slider. */
    showLabel: PropTypes.bool,
    /** The smallest value. Defaults to 0. */
    min: PropTypes.number,
    /** The largest value. Defaults to 100. */
    max: PropTypes.number,
    /** The current value, for a controlled slider. Pair it with `onChange`, or use `defaultValue` to leave the slider uncontrolled. */
    value: PropTypes.number,
    defaultValue: PropTypes.number,
    /** How much the value moves per key press or drag step. Defaults to 1. */
    step: PropTypes.number,
    /** Prevents interaction and dims the slider. */
    isDisabled: PropTypes.bool,
    /** The dot and bar, in px; the track follows. Unset keeps the default rendering. */
    size: PropTypes.oneOf([8, 12, 16]),
    /** Called with the new value as a number, then the change event. */
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Range;
