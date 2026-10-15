import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import Button from '@/components/actions/Button';
import useFieldId from './useFieldId';
import './FileUpload.scss';

const FileUpload = ({
    id,
    name,
    label,
    required = false,
    description,
    acceptedFormats,
    disabled = false,
    readOnly = false,
    validation = 'none',
    validationMessage,
    buttonText = 'Choose a file',
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    children,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const fileInputRef = useRef(null);
    /** One id for the label and the file input — see `useFieldId` (#206). */
    const fieldId = useFieldId(id);
    /** `success` is the old name for `valid`, the field vocabulary Figma uses. */
    const state = validation === 'success' ? 'valid' : validation;

    /*
     * #327 — see `Input.jsx`. This component has TWO things worth pointing at:
     * the format rules, which are standing help, and the validation message,
     * which is a result. Both, in reading order, so "PDF, up to 10 MB" is heard
     * before "that file was too large" rather than instead of it.
     */
    const descriptionId = `${fieldId}-description`;
    const validationId = state !== 'none' && validationMessage
        ? `${fieldId}-validation`
        : undefined;

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
        if (!disabled && !readOnly && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        if (disabled || readOnly) return;
        if (onChange) {
            onChange(e);
        }
    };

    // Determine border color based on state
    const getBorderColor = () => {
        if (disabled) return 'transparent';
        if (state === 'invalid') return 'var(--color-danger)';
        if (state === 'valid') return 'var(--color-success)';
        if (isFocused) return 'var(--color-primary)';
        return 'transparent';
    };

    const validationIcon = state === 'invalid' ? (
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
    ) : state === 'valid' ? (
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
            {label && (
                <Form.Label htmlFor={fieldId} className={`plus-file-upload-label ${disabled ? 'plus-file-upload-label-disabled' : ''}`}>
                    {label}
                    {required && (
                        <span className="plus-file-upload-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}

            {/*
             * The frame holds the description and the button, like the shared
             * field box: focus and validation outline this whole field, never
             * the button alone. The label sits above it; the file list and the
             * validation message sit below it.
             */}
            <div
                className={`plus-file-upload-container ${disabled ? 'plus-file-upload-disabled' : ''} ${readOnly ? 'plus-file-upload-readonly' : ''} ${state !== 'none' ? `plus-file-upload-${state}` : ''} ${isFocused ? 'plus-file-upload-focused' : ''}`}
                style={{
                    borderColor: getBorderColor(),
                    borderWidth: getBorderColor() !== 'transparent' ? '1px' : '0',
                    borderStyle: 'solid'
                }}
            >

                {descriptionText && (
                    <p id={descriptionId} className="plus-file-upload-description">
                        {descriptionText}
                    </p>
                )}

                <div className="plus-file-upload-button-container">
                    {/*
                     * Read-only shows the field and its files with nothing to
                     * choose: the input stays for the label and its description,
                     * and the button goes, since a file input has no native
                     * read-only state.
                     */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        id={fieldId}
                        name={name}
                        accept={acceptAttribute}
                        disabled={disabled}
                        onChange={handleFileChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className="plus-file-upload-input"
                        aria-label={label || 'File upload'}
                        {...props}
                        aria-describedby={[
                            props['aria-describedby'],
                            descriptionText ? descriptionId : undefined,
                            validationId,
                        ].filter(Boolean).join(' ') || undefined}
                        aria-invalid={state === 'invalid' || undefined}
                        aria-readonly={readOnly || undefined}
                        tabIndex={readOnly ? -1 : props.tabIndex}
                    />
                    {!readOnly && (<Button
                        text={buttonText}
                        style="primary"
                        fill="filled"
                        size="medium"
                        disabled={disabled}
                        onClick={handleButtonClick}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />)}
                </div>
            </div>

            {children && (
                <div className="plus-file-upload-files">
                    {children}
                </div>
            )}

            {state !== 'none' && validationMessage && (
                <div
                    id={validationId}
                    className={`plus-file-upload-validation plus-file-upload-validation-${state}`}
                >
                    {validationIcon}
                    <span className="plus-file-upload-validation-message">{validationMessage}</span>
                </div>
            )}
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
    /** Shows the field and its files without a way to choose a file. */
    readOnly: PropTypes.bool,
    /** `success` is deprecated: use `valid`. */
    validation: PropTypes.oneOf(['none', 'invalid', 'valid', 'success']),
    validationMessage: PropTypes.string,
    buttonText: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    /** The uploaded-file list, shown below the button and outside the frame. */
    children: PropTypes.node
};

export default FileUpload;


