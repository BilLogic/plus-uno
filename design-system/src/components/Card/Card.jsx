import React from 'react';
import PropTypes from 'prop-types';
import RBCard from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup'; // Use ListGroup for items if applicable, or custom divs
import Button from '@/components/Button';

/**
 * Card component for PLUS design system.
 * Universal card component for creating self-contained containers that display related information.
 * Uses React Bootstrap Card as base.
 */
const Card = ({
    id,
    image,
    title,
    subtitle,
    body,
    header,
    items,
    footer,
    links,
    actionButton,
    paddingSize = 'md',
    gapSize = 'md',
    radiusSize = 'sm',
    borderSize = 'sm',
    showBorder = true,
    className = '',
    style,
    onClick,
    children,
    ...props
}) => {
    // Construct custom classes for PLUS styling system (padding, gaps, borders)
    // We append these to the RB Card
    const customClasses = [
        'plus-card',
        paddingSize ? `plus-card-pad-${paddingSize}` : '',
        gapSize ? `plus-card-gap-${gapSize}` : '',
        radiusSize ? `plus-card-radius-${radiusSize}` : '',
        showBorder && borderSize ? `plus-card-border-${borderSize}` : '',
        !showBorder ? 'border-0' : '', // RB class to remove border
        className
    ].filter(Boolean).join(' ');

    const cardStyle = {
        ...style,
        cursor: onClick ? 'pointer' : undefined,
    };

    return (
        <RBCard
            id={id}
            className={customClasses}
            style={cardStyle}
            onClick={onClick}
            {...props}
        >
            {image && (
                typeof image === 'string'
                    ? <RBCard.Img variant="top" src={image} className="plus-card-image" />
                    : <div className="plus-card-image">{image}</div>
            )}

            {header && <RBCard.Header className="plus-card-header body1-txt">{header}</RBCard.Header>}

            <RBCard.Body className="plus-card-content">
                {(title || subtitle || body || children) && (
                    <div className="plus-card-description">
                        {title && <RBCard.Title className="plus-card-title h5">{title}</RBCard.Title>}
                        {subtitle && <RBCard.Subtitle className="plus-card-subtitle body3-txt mb-2 text-muted">{subtitle}</RBCard.Subtitle>}
                        {(body || children) && (
                            <RBCard.Text as="div" className="plus-card-body body1-txt">
                                {body}
                                {children}
                            </RBCard.Text>
                        )}
                    </div>
                )}

                {/* List Items - using ListGroup flush variant if appropriate, or sticking to custom divs for strict legacy match */}
                {items && items.length > 0 && (
                    <ListGroup className="plus-card-items list-group-flush">
                        {items.map((item, index) => (
                            <ListGroup.Item key={index} className="plus-card-item body1-txt border-light">
                                {item}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </RBCard.Body>

            {(footer || (links && links.length > 0) || actionButton) && (
                <RBCard.Footer className="plus-card-footer bg-transparent border-top-0 d-flex flex-wrap align-items-center justify-content-between">
                    {/* Footer Text */}
                    {footer && <div className="plus-card-footer-text body1-txt me-auto">{footer}</div>}

                    {/* Links */}
                    {links && links.length > 0 && (
                        <div className="plus-card-links d-flex gap-3">
                            {links.map((link, index) => (
                                <RBCard.Link
                                    key={index}
                                    href={link.href || '#'}
                                    className="plus-card-link body1-txt"
                                    onClick={(e) => {
                                        if (link.onClick) {
                                            e.preventDefault();
                                            link.onClick(e);
                                        }
                                    }}
                                >
                                    {link.text}
                                </RBCard.Link>
                            ))}
                        </div>
                    )}

                    {/* Action Button */}
                    {actionButton && (
                        <div className="plus-card-action-button ms-3">
                            <Button
                                btnText={actionButton.text || 'Action'}
                                btnStyle={actionButton.style || 'primary'}
                                btnFill={actionButton.fill || 'filled'}
                                btnSize={actionButton.size || 'default'}
                                onClick={(e) => {
                                    if (e) e.stopPropagation();
                                    if (actionButton.onClick) actionButton.onClick(e);
                                }}
                                icon={actionButton.icon}
                                iconPosition={actionButton.iconPosition || 'left'}
                            />
                        </div>
                    )}
                </RBCard.Footer>
            )}
        </RBCard>
    );
};

Card.propTypes = {
    id: PropTypes.string,
    image: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    title: PropTypes.string,
    subtitle: PropTypes.string,
    body: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    header: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.node])),
    footer: PropTypes.string,
    links: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        onClick: PropTypes.func,
    })),
    actionButton: PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        style: PropTypes.string,
        fill: PropTypes.string,
        size: PropTypes.string,
        icon: PropTypes.string,
        iconPosition: PropTypes.string,
    }),
    paddingSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    gapSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    radiusSize: PropTypes.oneOf(['sm', 'md']),
    borderSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    showBorder: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    onClick: PropTypes.func,
    children: PropTypes.node,
};

export default Card;
