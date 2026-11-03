import React from 'react';
import PropTypes from 'prop-types';
import { Select, Toggle } from '@/components';

/**
 * Session selection (Figma Elements · Session selection `20:24370`).
 * A Select labeled “Select Session”, and the “Session did not happen” Toggle.
 *
 * @param {object} props
 * @param {string} [props.id='session-select']
 * @param {string} [props.label='Select Session']
 * @param {string} [props.placeholder='Session site + time']
 * @param {string} [props.value='']
 * @param {(value: string) => void} [props.onChange]
 * @param {{ value: string, label: string }[]} [props.options=[]]
 * @param {boolean} [props.isRequired=true]
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
    isRequired = true,
    didNotHappen = false,
    onDidNotHappenChange,
    showDidNotHappen = true,
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--section-stack-sm)',
            width: '100%',
            maxWidth: 'var(--col-6)',
        }}
    >
        <Select
            id={id}
            label={label}
            isRequired={isRequired}
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />

        {showDidNotHappen && (
            <Toggle
                id={`${id}-did-not-happen`}
                label="Session did not happen"
                isChecked={didNotHappen}
                onChange={(event) => onDidNotHappenChange?.(event.target.checked)}
            />
        )}
    </div>
);

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
    isRequired: PropTypes.bool,
    didNotHappen: PropTypes.bool,
    onDidNotHappenChange: PropTypes.func,
    showDidNotHappen: PropTypes.bool,
};

export default SessionSelection;
