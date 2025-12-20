import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { InputGroup as BootstrapInputGroup, Form } from 'react-bootstrap';
import Button from '../../components/Button/Button';
import Dropdown from '../../components/Dropdown/Dropdown';
import './InputGroup.scss';

const InputGroup = ({
    id,
    name,
    placeholder,
    value,
    size = 'medium',
    disabled = false,
    readonly = false,
    leadingVisual,
    trailingVisual,
    leadingVisual2,
    trailingVisual2,
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    const bsSize = size === 'small' ? 'sm' : (size === 'large' ? 'lg' : undefined);

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    // Render addon component
    const renderAddon = (addon, position) => {
        if (!addon) return null;

        // If it's already a React element, use it directly
        if (React.isValidElement(addon)) {
            return addon;
        }

        // If it's a string descriptor, create the appropriate component
        if (typeof addon === 'string') {
            // Check if it's a type descriptor like "checkbox", "radio", etc.
            const type = addon.toLowerCase();
            switch (type) {
                case 'checkbox':
                    return <InputGroup.Checkbox size={size} checked />;
                case 'radio':
                    return <InputGroup.Radio size={size} checked />;
                case 'icon':
                case 'plus':
                    return <InputGroup.Icon size={size} />;
                case 'button':
                    return <InputGroup.Button size={size}>Button</InputGroup.Button>;
                case 'dropdown':
                    return <InputGroup.Dropdown size={size}>Dropdown</InputGroup.Dropdown>;
                default:
                    // Treat as text
                    return <InputGroup.Text size={size}>{addon}</InputGroup.Text>;
            }
        }

        // If it's an object descriptor
        if (typeof addon === 'object' && addon !== null) {
            const { type, ...addonProps } = addon;
            switch (type) {
                case 'checkbox':
                    return <InputGroup.Checkbox size={size} {...addonProps} />;
                case 'radio':
                    return <InputGroup.Radio size={size} {...addonProps} />;
                case 'icon':
                case 'plus':
                    return <InputGroup.Icon size={size} {...addonProps} />;
                case 'text':
                    return <InputGroup.Text size={size} {...addonProps}>{addonProps.children || addonProps.text}</InputGroup.Text>;
                case 'button':
                    return <InputGroup.Button size={size} {...addonProps}>{addonProps.children || addonProps.text || 'Button'}</InputGroup.Button>;
                case 'dropdown':
                    return <InputGroup.Dropdown size={size} {...addonProps}>{addonProps.children || addonProps.text || 'Dropdown'}</InputGroup.Dropdown>;
                default:
                    return null;
            }
        }

        return null;
    };

    const wrapperClasses = [
        'plus-input-group-wrapper',
        `plus-input-group-${size}`,
        sizeClass,
        disabled ? 'plus-input-group-disabled' : '',
        readonly ? 'plus-input-group-readonly' : '',
        isFocused ? 'plus-input-group-focused' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <BootstrapInputGroup
            id={id}
            size={bsSize}
            className={wrapperClasses}
            style={style}
            {...props}
        >
            {/* Leading visuals */}
            {leadingVisual && renderAddon(leadingVisual, 'leading')}
            {leadingVisual2 && renderAddon(leadingVisual2, 'leading2')}

            {/* Main input */}
            <Form.Control
                name={name}
                type="text"
                placeholder={placeholder}
                value={value}
                disabled={disabled}
                readOnly={readonly}
                onChange={onChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="plus-input-group-input"
            />

            {/* Trailing visuals */}
            {trailingVisual && renderAddon(trailingVisual, 'trailing')}
            {trailingVisual2 && renderAddon(trailingVisual2, 'trailing2')}
        </BootstrapInputGroup>
    );
};

// Subcomponent: Text
const InputGroupText = ({ children, size = 'medium', className = '', ...props }) => {
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    return (
        <BootstrapInputGroup.Text className={`plus-input-group-addon plus-input-group-text ${sizeClass} ${className}`} {...props}>
            {children}
        </BootstrapInputGroup.Text>
    );
};

InputGroupText.propTypes = {
    children: PropTypes.node,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    className: PropTypes.string
};

// Subcomponent: Checkbox
const InputGroupCheckbox = ({ checked = false, size = 'medium', disabled = false, onChange, className = '', ...props }) => {
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    return (
        <BootstrapInputGroup.Text className={`plus-input-group-addon plus-input-group-checkbox ${sizeClass} ${className}`} {...props}>
            <div className="plus-input-group-checkbox-input">
                <Form.Check
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={onChange}
                />
            </div>
        </BootstrapInputGroup.Text>
    );
};

InputGroupCheckbox.propTypes = {
    checked: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string
};

// Subcomponent: Radio
const InputGroupRadio = ({ checked = false, size = 'medium', disabled = false, onChange, className = '', ...props }) => {
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    return (
        <BootstrapInputGroup.Text className={`plus-input-group-addon plus-input-group-radio ${sizeClass} ${className}`} {...props}>
            <div className="plus-input-group-radio-input">
                <Form.Check
                    type="radio"
                    checked={checked}
                    disabled={disabled}
                    onChange={onChange}
                />
            </div>
        </BootstrapInputGroup.Text>
    );
};

InputGroupRadio.propTypes = {
    checked: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string
};

// Subcomponent: Icon (Plus)
const InputGroupIcon = ({ size = 'medium', className = '', ...props }) => {
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    return (
        <BootstrapInputGroup.Text className={`plus-input-group-addon plus-input-group-icon ${sizeClass} ${className}`} {...props}>
            <div className="plus-input-group-icon-wrapper">
                <i className="fa-solid fa-plus" aria-hidden="true" />
            </div>
        </BootstrapInputGroup.Text>
    );
};

InputGroupIcon.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    className: PropTypes.string
};

// Subcomponent: Button
const InputGroupButton = ({ 
    children, 
    text,
    size = 'medium', 
    disabled = false, 
    onClick, 
    style = 'primary',
    fill = 'ghost',
    className = '', 
    ...props 
}) => {
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    return (
        <BootstrapInputGroup.Text className={`plus-input-group-addon plus-input-group-button ${sizeClass} ${className}`} {...props}>
            <Button
                text={text || children}
                size={size}
                disabled={disabled}
                onClick={onClick}
                style={style}
                fill={fill}
                className="plus-input-group-button-element"
            />
        </BootstrapInputGroup.Text>
    );
};

InputGroupButton.propTypes = {
    children: PropTypes.node,
    text: PropTypes.string,
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

// Subcomponent: Dropdown
const InputGroupDropdown = ({ 
    children, 
    text,
    buttonText,
    size = 'medium', 
    disabled = false, 
    items = [],
    style = 'primary',
    className = '', 
    ...props 
}) => {
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    // Map InputGroup size to Dropdown size
    const dropdownSize = size === 'small' ? 'small' : (size === 'large' ? 'large' : 'default');
    
    const dropdownClassName = [
        'plus-input-group-dropdown-element',
        `pdropdown-${style}`,
        disabled ? 'plus-input-group-dropdown-disabled' : ''
    ].filter(Boolean).join(' ');
    
    return (
        <BootstrapInputGroup.Text className={`plus-input-group-addon plus-input-group-dropdown ${sizeClass} ${disabled ? 'plus-input-group-addon-disabled' : ''} ${className}`} {...props}>
            <Dropdown
                buttonText={buttonText || text || children || 'Dropdown'}
                size={dropdownSize}
                style={style}
                items={items}
                className={dropdownClassName}
                {...props}
            />
        </BootstrapInputGroup.Text>
    );
};

InputGroupDropdown.propTypes = {
    children: PropTypes.node,
    text: PropTypes.string,
    buttonText: PropTypes.string,
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

InputGroup.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    leadingVisual: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
        PropTypes.node
    ]),
    trailingVisual: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
        PropTypes.node
    ]),
    leadingVisual2: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
        PropTypes.node
    ]),
    trailingVisual2: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
        PropTypes.node
    ]),
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
};

export default InputGroup;

