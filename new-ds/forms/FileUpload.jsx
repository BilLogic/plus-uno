import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import Button from '../components/Button';
import './FileUpload.scss';

const FileUpload = ({
    id,
    name,
    label,
    required = false,
    description,
    acceptedFormats,
    disabled = false,
    validation = 'none', // 'none', 'invalid', 'success'
    validationMessage,
    buttonText = 'Choose a file',
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const fileInputRef = useRef(null);

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    const handleButtonClick = (e) => {
        e.preventDefault();
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        if (disabled) return;
        if (onChange) {
            onChange(e);
        }
    };

    // Determine border color based on state
    const getBorderColor = () => {
        if (disabled) return 'transparent';
        if (validation === 'invalid') return 'var(--color-danger)';
        if (validation === 'success') return 'var(--color-success)';
        if (isFocused) return 'var(--color-primary)';
        return 'transparent';
    };

    const validationIcon = validation === 'invalid' ? (
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
    ) : validation === 'success' ? (
        <i className="fa-solid fa-circle-check" aria-hidden="true" />
    ) : null;

    // Build description text
    const descriptionText = description || (acceptedFormats && acceptedFormats.length > 0
        ? `Accepted formats are ${acceptedFormats.join(', ')}`
        : null);

    // Build accept attribute for file input
    const acceptAttribute = acceptedFormats && acceptedFormats.length > 0
        ? acceptedFormats.join(',')
        : undefined;

    return (
        <div 
            className={`plus-file-upload-wrapper ${className}`} 
            style={style}
        >
            <div 
                className={`plus-file-upload-container ${disabled ? 'plus-file-upload-disabled' : ''} ${validation !== 'none' ? `plus-file-upload-${validation}` : ''} ${isFocused ? 'plus-file-upload-focused' : ''}`}
                style={{
                    borderColor: getBorderColor(),
                    borderWidth: getBorderColor() !== 'transparent' ? '1px' : '0',
                    borderStyle: 'solid'
                }}
            >
                {label && (
                    <Form.Label htmlFor={id || name} className="plus-file-upload-label">
                        {label}
                        {required && (
                            <span className="plus-file-upload-required" aria-label="required">*</span>
                        )}
                    </Form.Label>
                )}
                
                {descriptionText && (
                    <p className="plus-file-upload-description">
                        {descriptionText}
                    </p>
                )}

                <div className="plus-file-upload-button-container">
                    <input
                        ref={fileInputRef}
                        type="file"
                        id={id}
                        name={name}
                        accept={acceptAttribute}
                        disabled={disabled}
                        onChange={handleFileChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className="plus-file-upload-input"
                        aria-label={label || 'File upload'}
                        {...props}
                    />
                    <Button
                        text={buttonText}
                        style="primary"
                        fill="filled"
                        size="medium"
                        disabled={disabled}
                        onClick={handleButtonClick}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                </div>

                {validation !== 'none' && validationMessage && (
                    <div className={`plus-file-upload-validation plus-file-upload-validation-${validation}`}>
                        {validationIcon}
                        <span className="plus-file-upload-validation-message">{validationMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

FileUpload.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    required: PropTypes.bool,
    description: PropTypes.string,
    acceptedFormats: PropTypes.arrayOf(PropTypes.string),
    disabled: PropTypes.bool,
    validation: PropTypes.oneOf(['none', 'invalid', 'success']),
    validationMessage: PropTypes.string,
    buttonText: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
};

export default FileUpload;

