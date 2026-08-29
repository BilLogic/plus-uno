import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button/Button';
import './Jumbotron.scss';

const Jumbotron = ({
    title,
    subtitle,
    children, // body content
    primaryButton,
    secondaryButton,
    fluid = false,
    paddingSize = 'md',
    gapSize = 'md',
    radiusSize = 'md',
    className = '',
    id,
    style,
    ...props
}) => {
    const classes = [
        'plus-jumbotron',
        fluid ? 'plus-jumbotron-fluid' : '',
        paddingSize ? `plus-jumbotron-pad-${paddingSize}` : '',
        gapSize ? `plus-jumbotron-gap-${gapSize}` : '',
        (!fluid && radiusSize) ? `plus-jumbotron-radius-${radiusSize}` : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div id={id} className={classes} style={style} {...props}>
            <div className="plus-jumbotron-content">
                {title && <h1 className="plus-jumbotron-title h1">{title}</h1>}
                {subtitle && <p className="plus-jumbotron-subtitle h4">{subtitle}</p>}

                {children && <div className="plus-jumbotron-body body1-txt">{children}</div>}

                {(primaryButton || secondaryButton) && (
                    <div className="plus-jumbotron-actions">
                        {/*
                          * #317. `size="medium"` and not `"default"`: Button's
                          * `size` is `oneOf(['small','medium','large'])` and the
                          * value is interpolated straight into a class name, so
                          * `"default"` failed the prop type AND produced a class
                          * `Button.scss` has no rule for. `medium` is Button's own
                          * default, so this is now the value it would pick anyway.
                          */}
                        {primaryButton && (
                            <Button
                                text="Primary Action"
                                style="primary"
                                fill="filled"
                                size="medium"
                                {...primaryButton}
                            />
                        )}
                        {secondaryButton && (
                            <Button
                                text="Secondary Action"
                                style="secondary"
                                fill="outline"
                                size="medium"
                                {...secondaryButton}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

Jumbotron.propTypes = {
    title: PropTypes.node,
    subtitle: PropTypes.node,
    children: PropTypes.node,
    primaryButton: PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        style: PropTypes.string,
        fill: PropTypes.string,
        size: PropTypes.string,
        icon: PropTypes.string,
        iconPosition: PropTypes.string
    }),
    secondaryButton: PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        style: PropTypes.string,
        fill: PropTypes.string,
        size: PropTypes.string,
        icon: PropTypes.string,
        iconPosition: PropTypes.string
    }),
    fluid: PropTypes.bool,
    paddingSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    gapSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    radiusSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
    id: PropTypes.string,
    style: PropTypes.object
};

export default Jumbotron;
