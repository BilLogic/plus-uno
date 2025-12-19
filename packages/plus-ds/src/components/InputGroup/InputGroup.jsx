import React from 'react';
import PropTypes from 'prop-types';
import { InputGroup as BootstrapInputGroup, Form } from 'react-bootstrap';

const InputGroup = ({
    id,
    children, // Can be composed manually
    prepend, // Array or node: Text, Button, Icon, Checkbox...
    append,
    size = 'default', // 'sm', 'lg', 'default' -> legacy used 'small', 'large'. RB uses 'sm', 'lg'.
    className = '',
    style,
    ...props
}) => {
    // Map sizes
    const sizeMap = {
        'small': 'sm',
        'medium': undefined,
        'default': undefined,
        'large': 'lg'
    };

    const bsSize = sizeMap[size] || size;
    const bodyClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');

    const renderAddon = (addon) => {
        if (!addon) return null;
        if (typeof addon === 'string') {
            return <BootstrapInputGroup.Text className="plus-input-group-text">{addon}</BootstrapInputGroup.Text>;
        }
        if (React.isValidElement(addon)) {
            // Check if it's a Button or simple text/icon wrapper needed
            // If legacy passed an object { type: 'icon', iconClass: '...' }, we might need adaptors.
            // But in React usage, user will pass components.
            return addon;
        }
        // Handle legacy object descriptors if necessary? 
        // Let's assume React usage passes Nodes: <InputGroup.Text>...</InputGroup.Text> or <Button>...</Button>
        // But for migration ease, let's wrap non-Button elements in InputGroup.Text if they seem like text?
        // Actually RB InputGroup.Text is versatile.
        return addon;
    };

    // Helper to process arrays
    const renderAddons = (addons) => {
        if (Array.isArray(addons)) return addons.map((a, i) => <React.Fragment key={i}>{renderAddon(a)}</React.Fragment>);
        return renderAddon(addons);
    };

    return (
        <BootstrapInputGroup
            id={id}
            size={bsSize}
            className={`plus-input-group ${bodyClass} ${className}`}
            style={style}
            {...props}
        >
            {renderAddons(prepend)}
            {children}
            {renderAddons(append)}
        </BootstrapInputGroup>
    );
};

// Expose subcomponents for composition
InputGroup.Text = BootstrapInputGroup.Text;
InputGroup.Checkbox = BootstrapInputGroup.Checkbox;
InputGroup.Radio = BootstrapInputGroup.Radio;

InputGroup.propTypes = {
    id: PropTypes.string,
    children: PropTypes.node,
    prepend: PropTypes.node,
    append: PropTypes.node,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'sm', 'lg', 'default']),
    className: PropTypes.string,
    style: PropTypes.object
};

export default InputGroup;
