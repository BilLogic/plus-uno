import React from 'react';
import PropTypes from 'prop-types';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import useFieldId from './useFieldId';
import { LabelMarker } from '@/lib/field';
import './Fieldset.scss';

/**
 * Fieldset — a legend plus the fields it groups.
 *
 * A thin, token-styled wrap around Base UI's Fieldset: `Root` renders the
 * `<fieldset>`, `Legend` renders a `<div>` already wired to
 * `aria-labelledby` the fieldset. `RadioGroup` builds on this; a "Checkbox
 * group" is the same composition with `Checkbox` instead.
 */
const Fieldset = ({
    id,
    legend,
    labelMarker,
    isDisabled = false,
    isRequired = false,
    error,
    children,
    className = '',
    style,
    'aria-describedby': describedBy,
    ...props
}) => {
    const fieldId = useFieldId(id);
    const errorId = error ? `${fieldId}-error` : undefined;

    const classes = [
        'plus-fieldset',
        error ? 'plus-fieldset-invalid' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <BaseFieldset.Root
            id={fieldId}
            className={classes}
            style={style}
            disabled={isDisabled}
            aria-describedby={[describedBy, errorId].filter(Boolean).join(' ') || undefined}
            {...props}
        >
            {legend && (
                <BaseFieldset.Legend id={`${fieldId}-legend`} className="plus-fieldset-legend">
                    {legend}<LabelMarker marker={labelMarker} />
                    {isRequired && labelMarker !== 'required' && (
                        <>{' '}<span className="visually-hidden">(required)</span></>
                    )}
                </BaseFieldset.Legend>
            )}
            {children}
            {error && (
                <div id={errorId} className="plus-fieldset-error" role="alert">
                    {error}
                </div>
            )}
        </BaseFieldset.Root>
    );
};

Fieldset.propTypes = {
    /** Id of the fieldset. The legend and error ids derive from it. A generated id is used when omitted. */
    id: PropTypes.string,
    /** Labels the fieldset's contents. */
    legend: PropTypes.node,
    /** Marks the form's minority case in plain text after the legend: `required` or `optional`. */
    labelMarker: PropTypes.oneOf(['required', 'optional']),
    /** Disables the fieldset and every control inside it. */
    isDisabled: PropTypes.bool,
    /** Announces the group as required to assistive technology. Pair with `labelMarker="required"` only when required fields are the minority in the form. */
    isRequired: PropTypes.bool,
    /** One error for the group, announced when it appears. */
    error: PropTypes.node,
    /** The fields the legend groups. */
    children: PropTypes.node,
    /** Extra class on the `<fieldset>`, beside `plus-fieldset`. */
    className: PropTypes.string,
    /** Inline style on the `<fieldset>`. */
    style: PropTypes.object,
};

export default Fieldset;
