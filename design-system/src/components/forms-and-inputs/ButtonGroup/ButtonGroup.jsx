import React from 'react';
import PropTypes from 'prop-types';
import RBButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from '@/components/forms-and-inputs/Button/Button';
import './ButtonGroup.scss';

/**
 * ButtonGroup Component
 * Groups related buttons together with connected styling.
 * Supports horizontal and vertical layouts with consistent spacing.
 */
const ButtonGroup = ({
    // Content
    buttons = [],
    children,

    // Design
    appearance = 'default',
    spacing = 'default',
    vertical = false,
    block = false,

    // Development
    className = '',
    id,
    ariaLabel,
    ...props
}) => {
    // Build class names
    const groupClasses = [
        'plus-button-group',
        vertical ? 'plus-button-group--vertical' : '',
        block ? 'plus-button-group--block' : '',
        className
    ].filter(Boolean).join(' ');

    // Render buttons from array prop
    const renderButtons = () => {
        if (children) {
            // Clone children to pass group-level props
            return React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        spacing: child.props.spacing || spacing,
                        appearance: child.props.appearance || appearance,
                    });
                }
                return child;
            });
        }

        return buttons.map((buttonConfig, index) => (
            <Button
                key={buttonConfig.id || index}
                spacing={buttonConfig.spacing || spacing}
                appearance={buttonConfig.appearance || appearance}
                text={buttonConfig.text}
                iconBefore={buttonConfig.iconBefore}
                iconAfter={buttonConfig.iconAfter}
                onClick={buttonConfig.onClick}
                isDisabled={buttonConfig.isDisabled}
                isSelected={buttonConfig.isSelected}
                href={buttonConfig.href}
                {...buttonConfig.props}
            />
        ));
    };

    return (
        <RBButtonGroup
            id={id}
            vertical={vertical}
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
        spacing: PropTypes.string,
        appearance: PropTypes.string,
        iconBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        iconAfter: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        isDisabled: PropTypes.bool,
        isSelected: PropTypes.bool,
        href: PropTypes.string,
        id: PropTypes.string,
        props: PropTypes.object
    })),
    /** Child Button components (alternative to buttons array) */
    children: PropTypes.node,

    // Design
    /** Appearance for every button in the group */
    appearance: PropTypes.oneOf(['default', 'primary', 'subtle', 'warning', 'danger', 'discovery']),
    /** Spacing for every button in the group: default 32, compact 24 */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Stack buttons vertically */
    vertical: PropTypes.bool,
    /** Whether the group takes full width */
    block: PropTypes.bool,

    // Development
    /** Additional CSS classes */
    className: PropTypes.string,
    /** HTML ID attribute */
    id: PropTypes.string,
    /** Accessible label for the button group */
    ariaLabel: PropTypes.string
};

export default ButtonGroup;
