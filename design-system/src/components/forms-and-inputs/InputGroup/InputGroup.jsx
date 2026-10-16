import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import Button from '@/components/actions/Button/Button';
import Dropdown from '@/components/forms-and-inputs/Dropdown/Dropdown';
import useFieldId from '@/components/forms-and-inputs/useFieldId';
import Checkbox from '../Checkbox';
import Field, { FieldCaption, FieldLabel, FieldStack, fieldDescription } from '../_internal/Field';
import './InputGroup.scss';

/** One addon from a descriptor: a string, an object with a `type`, or a node. */
const renderAddon = (addon, key) => {
    if (!addon) return null;
    if (React.isValidElement(addon)) return React.cloneElement(addon, { key });

    if (typeof addon === 'string') {
        switch (addon.toLowerCase()) {
            case 'checkbox':
                return <InputGroupCheckbox key={key} checked />;
            case 'radio':
                return <InputGroupRadio key={key} checked />;
            case 'icon':
            case 'plus':
                return <InputGroupIcon key={key} />;
            case 'button':
                return <InputGroupButton key={key}>Button</InputGroupButton>;
            case 'dropdown':
                return <InputGroupDropdown key={key}>Dropdown</InputGroupDropdown>;
            default:
                return <InputGroupText key={key}>{addon}</InputGroupText>;
        }
    }

    if (typeof addon === 'object') {
        const { type, ...addonProps } = addon;
        const content = addonProps.children || addonProps.text;
        switch (type) {
            case 'checkbox':
                return <InputGroupCheckbox key={key} {...addonProps} />;
            case 'radio':
                return <InputGroupRadio key={key} {...addonProps} />;
            case 'icon':
            case 'plus':
                return <InputGroupIcon key={key} {...addonProps} />;
            case 'text':
                return <InputGroupText key={key} {...addonProps}>{content}</InputGroupText>;
            case 'button':
                return <InputGroupButton key={key} {...addonProps}>{content || 'Button'}</InputGroupButton>;
            case 'dropdown':
                return <InputGroupDropdown key={key} {...addonProps}>{content || 'Dropdown'}</InputGroupDropdown>;
            default:
                return null;
        }
    }
    return null;
};

/** A slot takes one addon or a list of them. */
const renderSlot = (visual) => {
    if (!visual) return null;
    const addons = (Array.isArray(visual) ? visual : [visual]).map(renderAddon).filter(Boolean);
    return addons.length ? addons : null;
};

/**
 * InputGroup — an Input whose addons sit in the field's Leading and Trailing
 * slots: text affixes ("$", ".00"), a checkbox or radio, an icon, small
 * buttons and a small dropdown. No addon draws a box; the field is the box.
 *
 * `leadingVisual` and `trailingVisual` each take one addon or an array.
 */
const InputGroup = ({
    id,
    name,
    /** The field's name. Render one unless something else on the page names it. */
    label,
    /** Hides the label; it does not remove it. Same rule as `Input`. */
    showLabel = true,
    required = false,
    info,
    caption,
    placeholder,
    value,
    defaultValue,
    size = 'medium',
    disabled = false,
    readOnly,
    /** @deprecated Prefer `readOnly` */
    readonly,
    validation = 'none',
    validationMessage,
    leadingVisual,
    trailingVisual,
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    inputRef,
    ...props
}) => {
    /** One id for the label and the input — see `useFieldId`. */
    const fieldId = useFieldId(id);
    const isReadOnly = readOnly !== undefined ? readOnly : Boolean(readonly);

    const tone = validation === 'invalid' ? 'invalid' : (validation === 'success' ? 'success' : 'help');
    const message = (validation !== 'none' && validationMessage) || caption;
    const { messageId, describedBy } = fieldDescription({
        fieldId,
        message,
        describedBy: props['aria-describedby'],
    });

    return (
        <FieldStack disabled={disabled} className="plus-input-group-container">
            <FieldLabel htmlFor={fieldId} required={required} info={info} hidden={!showLabel}>
                {label}
            </FieldLabel>
            <Field
                size={size}
                disabled={disabled}
                readOnly={isReadOnly}
                invalid={tone === 'invalid'}
                valid={tone === 'success'}
                leading={renderSlot(leadingVisual)}
                trailing={renderSlot(trailingVisual)}
                className={`plus-input-group-wrapper ${className}`.trim()}
                style={style}
            >
                {/*
                  * Extra props go to the FIELD, not to the box: the box is a
                  * `div` with no role and no name, so a caller's `aria-label`
                  * or `aria-describedby` would land somewhere it cannot help.
                  */}
                <input
                    ref={inputRef}
                    id={fieldId}
                    name={name}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    defaultValue={defaultValue}
                    disabled={disabled}
                    readOnly={isReadOnly}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    className="plus-field__control plus-input-group-input"
                    aria-required={required || undefined}
                    {...props}
                    aria-describedby={describedBy}
                    aria-invalid={tone === 'invalid' || undefined}
                />
            </Field>
            <FieldCaption messageId={messageId} message={message} tone={tone} />
        </FieldStack>
    );
};

/** Text addon — the field's affix: "$", ".00", "https://". */
const InputGroupText = ({ children, className = '', ...props }) => (
    <span className={`plus-field-affix plus-input-group-addon plus-input-group-text ${className}`.trim()} {...props}>
        {children}
    </span>
);

InputGroupText.propTypes = {
    children: PropTypes.node,
    /** Accepted for older call sites; the field sets the size. */
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    className: PropTypes.string
};

/** Checkbox addon — code's Checkbox box (18), centred. Name it: the default is generic. */
const InputGroupCheckbox = ({
    checked = false,
    disabled = false,
    onChange,
    className = '',
    'aria-label': ariaLabel = 'Toggle option',
    size: _size,
    ...props
}) => (
    <span className={`plus-input-group-addon plus-input-group-checkbox ${className}`.trim()} {...props}>
        <Checkbox
            checked={checked}
            disabled={disabled}
            onChange={onChange || (() => {})}
            aria-label={ariaLabel}
        />
    </span>
);

InputGroupCheckbox.propTypes = {
    checked: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    'aria-label': PropTypes.string
};

/** Radio addon. Name it: the default is generic. */
const InputGroupRadio = ({
    checked = false,
    disabled = false,
    onChange,
    className = '',
    'aria-label': ariaLabel = 'Select option',
    size: _size,
    ...props
}) => (
    <span className={`plus-input-group-addon plus-input-group-radio ${className}`.trim()} {...props}>
        <Form.Check
            type="radio"
            checked={checked}
            disabled={disabled}
            onChange={onChange || (() => {})}
            aria-label={ariaLabel}
        />
    </span>
);

InputGroupRadio.propTypes = {
    checked: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    'aria-label': PropTypes.string
};

/** Icon addon. Decoration: it is hidden from assistive technology. */
const InputGroupIcon = ({ icon = 'fa-solid fa-plus', className = '', size: _size, ...props }) => (
    <span className={`plus-input-group-addon plus-input-group-icon ${className}`.trim()} {...props}>
        <i className={icon} aria-hidden="true" />
    </span>
);

InputGroupIcon.propTypes = {
    /** A Font Awesome Free class. */
    icon: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    className: PropTypes.string
};

/**
 * Button addon — always a small button, cut to the field's line so the field
 * keeps its height (22 in a medium field), as in Figma.
 */
const InputGroupButton = ({
    children,
    text,
    disabled = false,
    onClick,
    style = 'primary',
    fill = 'outline',
    className = '',
    size: _size,
    ...props
}) => (
    <Button
        text={text || children}
        size="small"
        disabled={disabled}
        onClick={onClick}
        style={style}
        fill={fill}
        className={`plus-input-group-addon plus-input-group-button-element ${className}`.trim()}
        {...props}
    />
);

InputGroupButton.propTypes = {
    children: PropTypes.node,
    text: PropTypes.string,
    /** Accepted for older call sites; addon buttons are always small. */
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    style: PropTypes.oneOf([
        'primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info', 'default',
        'social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools'
    ]),
    fill: PropTypes.oneOf(['filled', 'tonal', 'outline', 'ghost']),
    className: PropTypes.string
};

/** Dropdown addon — always the small Dropdown button. */
const InputGroupDropdown = ({
    children,
    text,
    buttonText,
    disabled = false,
    items = [],
    style = 'primary',
    className = '',
    size: _size,
    ...props
}) => {
    const dropdownClassName = [
        'plus-input-group-dropdown-element',
        `pdropdown-${style}`,
        disabled ? 'plus-input-group-dropdown-disabled' : ''
    ].filter(Boolean).join(' ');

    // The rest props are the Dropdown's (`id`, `ariaLabel`, `onToggle`…), so
    // they go to it alone, once.
    return (
        <span className={`plus-input-group-addon plus-input-group-dropdown ${disabled ? 'plus-input-group-addon-disabled' : ''} ${className}`.trim()}>
            <Dropdown
                buttonText={buttonText || text || children || 'Dropdown'}
                size="small"
                style={style}
                items={items}
                className={dropdownClassName}
                {...props}
            />
        </span>
    );
};

InputGroupDropdown.propTypes = {
    children: PropTypes.node,
    text: PropTypes.string,
    buttonText: PropTypes.string,
    /** Accepted for older call sites; the addon is always small. */
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    items: PropTypes.array,
    style: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'default']),
    className: PropTypes.string
};

// Attach subcomponents
InputGroup.Text = InputGroupText;
InputGroup.Checkbox = InputGroupCheckbox;
InputGroup.Radio = InputGroupRadio;
InputGroup.Icon = InputGroupIcon;
InputGroup.Button = InputGroupButton;
InputGroup.Dropdown = InputGroupDropdown;

const addon = PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.node]);

InputGroup.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    /** The field's name. Render one unless something else on the page names it. */
    label: PropTypes.node,
    /** Hides the label without removing it. */
    showLabel: PropTypes.bool,
    /** Shows an asterisk and sets `aria-required`. */
    required: PropTypes.bool,
    /** Text for an info tooltip beside the label. */
    info: PropTypes.node,
    /** Standing help under the field. A validation message takes its place. */
    caption: PropTypes.node,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    /** @deprecated Prefer `readOnly` */
    readonly: PropTypes.bool,
    validation: PropTypes.oneOf(['none', 'invalid', 'success']),
    validationMessage: PropTypes.node,
    /** One addon, or an array of them, for the Leading slot. */
    leadingVisual: PropTypes.oneOfType([addon, PropTypes.arrayOf(addon)]),
    /** One addon, or an array of up to two, for the Trailing slot. */
    trailingVisual: PropTypes.oneOfType([addon, PropTypes.arrayOf(addon)]),
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    inputRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({ current: PropTypes.instanceOf(Element) })
    ])
};

export default InputGroup;
