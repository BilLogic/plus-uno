import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup } from 'react-bootstrap';
import './OptionList.scss';

const OptionList = ({
    id,
    options = [],
    onSelect,
    disabled = false,
    className = '',
    style,
    ...props
}) => {
    const handleSelect = (option, index) => {
        if (!disabled && onSelect) {
            onSelect(option, index);
        }
    };

    return (
        <div className={`plus-option-list-wrapper ${className}`} id={id} style={style}>
            <ListGroup className="plus-option-list" {...props}>
                {options.map((option, index) => {
                    const optionText = typeof option === 'string' ? option : (option.text || option.label || 'Option');
                    const optionValue = typeof option === 'string' ? option : (option.value || optionText);
                    const isDisabled = disabled || (typeof option === 'object' && option.disabled);

                    return (
                        <ListGroup.Item
                            key={index}
                            action={!isDisabled}
                            disabled={isDisabled}
                            className="plus-option-list-item"
                            onClick={() => handleSelect(option, index)}
                        >
                            <span className="plus-option-list-text">{optionText}</span>
                            <i className="fa-solid fa-caret-right plus-option-list-chevron" aria-hidden="true" />
                        </ListGroup.Item>
                    );
                })}
            </ListGroup>
        </div>
    );
};

OptionList.propTypes = {
    id: PropTypes.string,
    options: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                text: PropTypes.string,
                label: PropTypes.string,
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                disabled: PropTypes.bool
            })
        ])
    ),
    onSelect: PropTypes.func,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object
};

export default OptionList;



