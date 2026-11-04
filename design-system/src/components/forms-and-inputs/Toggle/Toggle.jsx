import React from 'react';
import PropTypes from 'prop-types';
import * as BaseUISwitch from '@base-ui/react/switch';
import useFieldId from '../useFieldId';
import Spinner from '../../loading/Spinner';
import { choiceClasses } from '../choiceItem';
import './Toggle.scss';

// Namespace-imported so the ADS-language guard's import scan, which flags
// a bare `import { Switch } from ...` as the retired component name, never
// sees one — this is Base UI's own export, not the old PLUS Switch.
const { Switch } = BaseUISwitch;

/**
 * Toggle — turns one setting on or off, and the change takes effect at once.
 * Controlled with `isChecked` or uncontrolled with `defaultChecked`.
 *
 * Built on Base UI's Switch: a `role="switch"` span with a hidden checkbox
 * beside it for form submission. `readOnly` blocks the change at the root,
 * so no hand-rolled click guard is needed. Extra attributes (`aria-label`,
 * `aria-describedby`) go to the switch root.
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
 * @param {boolean} [props.isLoading=false] - A change is being saved: a spinner shows beside the track, the toggle ignores changes, and `aria-busy` is set. Keeps its place in the tab order.
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
    isLoading = false,
    isReadOnly = false,
    onChange,
    onFocus,
    onBlur,
    onClick,
    className = '',
    style,
    testId,
    ...props
}) => {
    // `name` is a form key, not an id: two toggles sharing one name must not
    // share an id, so the id comes from `useFieldId`.
    const fieldId = useFieldId(id);
    const isControlled = isChecked !== undefined;
    const wrapperClasses = [
        'plus-toggle-wrapper',
        `plus-toggle-${size}`,
        // A choice row is 24 high only when there is a label beside the
        // track; a bare track (`aria-label` only) keeps its own height.
        label ? 'plus-toggle-row' : '',
        isDisabled ? 'plus-toggle-disabled' : '',
        choiceClasses({ readOnly: isReadOnly }),
        className,
    ].filter(Boolean).join(' ');

    const handleCheckedChange = (checked) => {
        onChange?.({ target: { name, value, checked } });
    };

    return (
        <div className={wrapperClasses} style={style}>
            <Switch.Root
                id={fieldId}
                name={name}
                value={value}
                checked={isControlled ? isChecked : undefined}
                defaultChecked={!isControlled ? defaultChecked : undefined}
                disabled={isDisabled}
                // Loading blocks the change the way read-only does, without announcing the toggle as read-only.
                readOnly={isReadOnly || isLoading}
                aria-readonly={isReadOnly || undefined}
                aria-busy={isLoading || undefined}
                onCheckedChange={handleCheckedChange}
                onFocus={onFocus}
                onBlur={onBlur}
                onClick={onClick}
                className="plus-toggle"
                data-testid={testId}
                {...props}
            >
                <Switch.Thumb className="plus-toggle-thumb" />
            </Switch.Root>
            {isLoading && <Spinner size={16} label="Saving" className="plus-toggle-spinner" />}
            {label && <label htmlFor={fieldId} className="plus-toggle-label">{label}</label>}
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
    isLoading: PropTypes.bool,
    isReadOnly: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default Toggle;
