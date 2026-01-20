import React from 'react';
import PropTypes from 'prop-types';
import RBButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from '@/components/Button/Button';
import './ButtonGroup.scss';

/**
 * ButtonGroup Component
 * Groups related buttons together with connected styling.
 * Supports horizontal and vertical layouts with consistent sizing.
 */
const ButtonGroup = ({
    // Content
    buttons = [],
    children,

    // Design
    size = 'medium',
    style = 'primary',
    fill = 'tonal', // Tonal is default per Figma spec
    vertical = false,

    // Development
    className = '',
    id,
    ariaLabel,
    ...props
}) => {
    // Map size to React Bootstrap size prop
    const bsSize = size === 'small' ? 'sm' : size === 'large' ? 'lg' : undefined;

    // Build class names
    const groupClasses = [
        'plus-button-group',
        vertical ? 'plus-button-group--vertical' : '',
        className
    ].filter(Boolean).join(' ');

    // Render buttons from array prop
    const renderButtons = () => {
        if (children) {
            // Clone children to pass group-level props
            return React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        size: child.props.size || size,
                        style: child.props.style || style,
                        fill: child.props.fill || fill,
                    });
                }
                return child;
            });
        }

        return buttons.map((buttonConfig, index) => (
            <Button
                key={buttonConfig.id || index}
                size={buttonConfig.size || size}
                style={buttonConfig.style || style}
                fill={buttonConfig.fill || fill}
                text={buttonConfig.text}
                leadingVisual={buttonConfig.leadingVisual}
                trailingVisual={buttonConfig.trailingVisual}
                onClick={buttonConfig.onClick}
                disabled={buttonConfig.disabled}
                active={buttonConfig.active}
                href={buttonConfig.href}
                {...buttonConfig.props}
            />
        ));
    };

    return (
        <RBButtonGroup
            id={id}
            vertical={vertical}
            size={bsSize}
            className={groupClasses}
            role="group"
            aria-label={ariaLabel}
            {...props}
        >
            {renderButtons()}
        </RBButtonGroup>
    );
};

ButtonGroup.propTypes = {
    // Content
    /** Array of button configurations */
    buttons: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        size: PropTypes.string,
        style: PropTypes.string,
        fill: PropTypes.string,
        leadingVisual: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        trailingVisual: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        disabled: PropTypes.bool,
        active: PropTypes.bool,
        href: PropTypes.string,
        id: PropTypes.string,
        props: PropTypes.object
    })),
    /** Child Button components (alternative to buttons array) */
    children: PropTypes.node,

    // Design
    /** Size of buttons in the group */
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    /** Color style theme */
    style: PropTypes.oneOf([
        'primary', 'secondary', 'tertiary',
        'success', 'warning', 'danger', 'info'
    ]),
    /** Fill variant for buttons */
    fill: PropTypes.oneOf(['filled', 'tonal', 'outline', 'ghost']),
    /** Stack buttons vertically */
    vertical: PropTypes.bool,

    // Development
    /** Additional CSS classes */
    className: PropTypes.string,
    /** HTML ID attribute */
    id: PropTypes.string,
    /** Accessible label for the button group */
    ariaLabel: PropTypes.string
};

export default ButtonGroup;
