import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import useFieldId from './useFieldId';
import { choiceInputProps, choiceClasses } from './choiceItem';
import './Toggle.scss';

/**
 * Toggle — turns one setting on or off, and the change takes effect at once.
 * Controlled with `isChecked` or uncontrolled with `defaultChecked`.
 *
 * The native input keeps `type="checkbox"` with `role="switch"`, the markup the
 * W3C switch pattern ships: the platform maps the checked state, so no
 * `aria-checked` is written. Extra attributes (`aria-label`, `aria-describedby`)
 * go to the input.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {string} [props.name]
 * @param {React.ReactNode} [props.label] - Visible text beside the track. Where the label sits elsewhere, leave it out and pass `aria-label`.
 * @param {string|number} [props.value='on']
 * @param {boolean} [props.isChecked]
 * @param {boolean} [props.defaultChecked]
 * @param {16|20} [props.size=16] - Track height in pixels. 16 is the default for pages with many toggles; 20 calls attention to one setting.
 * @param {boolean} [props.isDisabled=false]
 * @param {boolean} [props.isReadOnly=false] - Shown, focusable and announced read-only; the state does not change
 * @param {(event: React.ChangeEvent) => void} [props.onChange]
 * @param {(event: React.FocusEvent) => void} [props.onFocus]
 * @param {(event: React.FocusEvent) => void} [props.onBlur]
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
const Toggle = ({
    id,
    name,
    label,
    value = 'on',
    isChecked,
    defaultChecked,
    size = 16,
    isDisabled = false,
    isReadOnly = false,
    onChange,
    onFocus,
    onBlur,
    onClick,
    className = '',
    style,
    ...props
}) => {
    // `name` is a form key, not an id: two toggles sharing one name must not
    // share an id, so the id comes from `useFieldId`.
    const fieldId = useFieldId(id);
    const isControlled = isChecked !== undefined;
    const wrapperClasses = [
        'plus-toggle-wrapper',
        `plus-toggle-${size}`,
        isDisabled ? 'plus-toggle-disabled' : '',
        choiceClasses({ readOnly: isReadOnly }),
        className,
    ].filter(Boolean).join(' ');

    const { type: _ignoredType, 'aria-describedby': describedBy, ...safeInputProps } = props;
    const { inputProps: readOnlyProps } = choiceInputProps({
        fieldId, readOnly: isReadOnly, onChange, onClick, describedBy,
    });

    return (
        <div className={wrapperClasses} style={style}>
            <Form.Check
                role="switch"
                {...safeInputProps}
                type="switch"
                id={fieldId}
                name={name}
                value={value}
                checked={isControlled ? isChecked : undefined}
                defaultChecked={!isControlled ? defaultChecked : undefined}
                disabled={isDisabled}
                {...readOnlyProps}
                aria-readonly={isReadOnly || undefined}
                onFocus={onFocus}
                onBlur={onBlur}
                label={label}
                className="plus-toggle"
            />
        </div>
    );
};

Toggle.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isChecked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    size: PropTypes.oneOf([16, 20]),
    isDisabled: PropTypes.bool,
    isReadOnly: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Toggle;
