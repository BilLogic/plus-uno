import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Select from '@/components/forms-and-inputs/Select';
import Switch from '@/components/forms-and-inputs/Switch';

/**
 * Session selection (Figma Elements · Session selection `20:24370`).
 * Label B3 + medium outline field + “Session did not happen” switch.
 *
 * @param {object} props
 * @param {string} [props.id='session-select']
 * @param {string} [props.label='Select Session']
 * @param {string} [props.placeholder='Session site + time']
 * @param {string} [props.value='']
 * @param {(value: string) => void} [props.onChange]
 * @param {{ value: string, label: string }[]} [props.options=[]]
 * @param {object[]} [props.items=[]] - Legacy Dropdown items; mapped to options when `options` is empty
 * @param {string} [props.buttonText] - Legacy display hint; use `value` + `options` instead
 * @param {boolean} [props.required=true]
 * @param {boolean} [props.didNotHappen=false]
 * @param {(checked: boolean) => void} [props.onDidNotHappenChange]
 * @param {boolean} [props.showDidNotHappen=true]
 */
const SessionSelection = ({
    id = 'session-select',
    label = 'Select Session',
    placeholder = 'Session site + time',
    value = '',
    onChange,
    options = [],
    items = [],
    buttonText,
    required = true,
    didNotHappen = false,
    onDidNotHappenChange,
    showDidNotHappen = true,
}) => {
    const selectOptions = useMemo(() => {
        if (options.length > 0) {
            return options;
        }
        return items.map((item) => ({
            value: item.value || item.text,
            label: item.text,
        }));
    }, [options, items]);

    const selectedValue = useMemo(() => {
        if (value) {
            return value;
        }
        const selectedItem = items.find((item) => item.selected);
        return selectedItem ? (selectedItem.value || selectedItem.text) : '';
    }, [value, items]);

    /**
     * @param {string} nextValue
     */
    const handleChange = (nextValue) => {
        onChange?.(nextValue);
        const legacyItem = items.find(
            (item) => (item.value || item.text) === nextValue,
        );
        legacyItem?.onClick?.();
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)',
                width: '100%',
                maxWidth: '331px',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)', width: '100%' }}>
                <label htmlFor={id} className="body3-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                    {label}
                    {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                </label>
                <div className="w-100" style={{ width: '100%' }}>
                    <Select
                        id={id}
                        mode="single"
                        options={selectOptions}
                        value={selectedValue}
                        onChange={handleChange}
                        placeholder={buttonText || placeholder}
                    />
                </div>
            </div>

            {showDidNotHappen && (
                <Switch
                    id={`${id}-did-not-happen`}
                    label={(
                        <span style={{ opacity: didNotHappen ? 1 : 0.38 }}>
                            Session did not happen
                        </span>
                    )}
                    checked={didNotHappen}
                    onChange={(event) => onDidNotHappenChange?.(event.target.checked)}
                />
            )}
        </div>
    );
};

SessionSelection.propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    })),
    items: PropTypes.array,
    buttonText: PropTypes.string,
    required: PropTypes.bool,
    didNotHappen: PropTypes.bool,
    onDidNotHappenChange: PropTypes.func,
    showDidNotHappen: PropTypes.bool,
};

export default SessionSelection;
