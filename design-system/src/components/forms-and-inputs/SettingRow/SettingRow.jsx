import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import useFieldId from '../useFieldId';
import Icon from '../../images-and-icons/Icon';
import './SettingRow.scss';

/**
 * SettingRow — puts a setting's name and one-line description at the start and
 * its control (`Toggle`, compact `Select`, or `Button`) at the end, top-aligned
 * to the label.
 *
 * Any `status` (`StatusTag`) sits beside the label so the end slot holds only
 * the action. The row's `label` names `control` through `aria-labelledby`;
 * controls that carry their own visible action text (such as a `Disconnect`
 * `Button`) combine their own id with the row label id so both the action and
 * the setting name are announced.
 */
const SettingRow = ({
    label,
    description,
    control,
    status,
    error,
    isDisabled = false,
    isReadOnly = false,
    id,
    className = '',
    style,
    testId,
}) => {
    const rowId = useFieldId(id);
    const labelId = `${rowId}-label`;
    const descriptionId = description ? `${rowId}-description` : undefined;
    const errorId = error ? `${rowId}-error` : undefined;

    const controlElement = React.isValidElement(control) && control.type !== React.Fragment
        ? control
        : null;
    const disabled = Boolean(
        isDisabled || controlElement?.props?.isDisabled || controlElement?.props?.disabled
    );
    const readOnly = Boolean(
        isReadOnly
        || controlElement?.props?.isReadOnly
        || controlElement?.props?.readonly
        || controlElement?.props?.readOnly
    );

    let renderedControl = control;
    if (controlElement) {
        const isDomElement = typeof controlElement.type === 'string';
        const hasOwnActionText = controlElement.props.text != null
            || (
                controlElement.props.children != null
                && controlElement.type !== 'select'
                && controlElement.props.options === undefined
            );
        const controlId = hasOwnActionText
            ? (controlElement.props.id || `${rowId}-control`)
            : controlElement.props.id;

        const labelledBy = hasOwnActionText
            ? [controlElement.props['aria-labelledby'], controlId, labelId].filter(Boolean).join(' ')
            : [controlElement.props['aria-labelledby'], labelId].filter(Boolean).join(' ');

        const describedBy = [controlElement.props['aria-describedby'], descriptionId, errorId]
            .filter(Boolean)
            .join(' ') || undefined;

        const extraProps = {
            'aria-labelledby': labelledBy,
            ...(hasOwnActionText && !controlElement.props.id ? { id: controlId } : {}),
            ...(describedBy ? { 'aria-describedby': describedBy } : {}),
            ...(error && controlElement.props['aria-invalid'] === undefined ? { 'aria-invalid': true } : {}),
        };

        if (isDisabled) {
            if (isDomElement && controlElement.props.disabled === undefined) {
                extraProps.disabled = true;
            } else if (!isDomElement && controlElement.props.isDisabled === undefined) {
                extraProps.isDisabled = true;
            }
        }

        if (isReadOnly && !hasOwnActionText) {
            if (isDomElement && controlElement.props.readOnly === undefined) {
                extraProps.readOnly = true;
            } else if (!isDomElement && controlElement.props.isReadOnly === undefined) {
                extraProps.isReadOnly = true;
            }
        }

        renderedControl = React.cloneElement(controlElement, extraProps);
    }

    return (
        <div
            id={id}
            data-testid={testId}
            style={style}
            className={clsx(
                'plus-setting-row',
                {
                    'plus-setting-row--disabled': disabled,
                    'plus-setting-row--readonly': readOnly,
                    'plus-setting-row--error': Boolean(error),
                },
                className
            )}
        >
            <div className="plus-setting-row__body">
                <div className="plus-setting-row__label-row">
                    <span id={labelId} className="plus-setting-row__label">
                        {label}
                    </span>
                    {status && (
                        <span className="plus-setting-row__status">
                            {status}
                        </span>
                    )}
                </div>
                {description && (
                    <div id={descriptionId} className="plus-setting-row__description">
                        {description}
                    </div>
                )}
                {error && (
                    <div id={errorId} className="plus-setting-row__error" role="alert">
                        <Icon name="circle-exclamation" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
            {renderedControl != null && (
                <div className="plus-setting-row__end">
                    {renderedControl}
                </div>
            )}
        </div>
    );
};

SettingRow.displayName = 'SettingRow';

SettingRow.propTypes = {
    /** The setting's name. Names `control` through `aria-labelledby`. */
    label: PropTypes.node.isRequired,
    /** One line of context under the label, or the visible reason when disabled or read-only. */
    description: PropTypes.node,
    /** The setting's control at the end: a `Toggle` (with no own label), a compact `Select`, or a `Button`. */
    control: PropTypes.node,
    /** Optional `StatusTag` shown beside `label`, never inside the control slot. */
    status: PropTypes.node,
    /** Inline error message shown under `description` when saving or changing the setting fails. */
    error: PropTypes.node,
    /** Dims the setting label and forwards `isDisabled` to `control` while keeping `description` readable as the reason. */
    isDisabled: PropTypes.bool,
    /** Marks the setting read-only and forwards `isReadOnly` to value controls. */
    isReadOnly: PropTypes.bool,
    /** Optional id on the row container; also prefixes the generated label and description ids. */
    id: PropTypes.string,
    /** Extra class names added to the row container. */
    className: PropTypes.string,
    /** Inline style on the row container. */
    style: PropTypes.object,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default SettingRow;
