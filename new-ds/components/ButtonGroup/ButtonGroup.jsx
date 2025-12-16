import React from 'react';
import PropTypes from 'prop-types';
import RBButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from '@/components/Button/Button';

const ButtonGroup = ({
    buttons = [],
    size = 'default',
    style = 'primary',
    fill = 'filled',
    alignment = 'horizontal',
    className = '',
    id,
    ...props
}) => {
    // Map alignment to 'vertical' prop (boolean) for RB
    const isVertical = alignment === 'vertical';

    // Map size
    const bsSize = size === 'small' ? 'sm' : size === 'large' ? 'lg' : undefined;

    return (
        <RBButtonGroup
            id={id}
            vertical={isVertical}
            size={bsSize}
            className={`plus-button-group ${className}`}
            role="group"
            {...props}
        >
            {buttons.map((buttonConfig, index) => (
                <Button
                    key={index}
                    // Button group children usually share size/style overrides
                    size={buttonConfig.size || size}
                    btnStyle={buttonConfig.btnStyle || style} // Note: Button.jsx expects btnStyle not style prop for variant? Check Button.jsx propTypes.
                    // Wait, Button.jsx prop is 'btnStyle'. ButtonGroup passed 'style'.
                    // I should pass 'btnStyle' to Button.
                    btnFill={buttonConfig.fill || 'tonal'} // Default tonal for groups per legacy
                    {...buttonConfig}
                />
            ))}
        </RBButtonGroup>
    );
};

ButtonGroup.propTypes = {
    buttons: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        size: PropTypes.string,
        btnStyle: PropTypes.string,
        fill: PropTypes.string
    })),
    size: PropTypes.PropTypes.string,
    style: PropTypes.string,
    fill: PropTypes.string,
    alignment: PropTypes.oneOf(['horizontal', 'vertical']),
    className: PropTypes.string,
    id: PropTypes.string
};

export default ButtonGroup;
