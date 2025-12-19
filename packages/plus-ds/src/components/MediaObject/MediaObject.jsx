import React from 'react';
import PropTypes from 'prop-types';

const MediaObject = ({
    media, // Image URL string or React Node
    heading, // Heading string or React Node
    children, // Body content
    alignment = 'left', // 'left', 'left-center', 'left-bottom', 'right', 'right-center', 'right-bottom'
    mediaSize = 'default',
    className = '',
    onClick,
    ...props
}) => {

    const isRight = alignment.startsWith('right');
    const verticalAlign = alignment.includes('center') ? 'plus-media-center' :
        alignment.includes('bottom') ? 'plus-media-bottom' : ''; // Default is top

    const containerClasses = [
        'media',
        'plus-media',
        isRight ? 'plus-media-right' : '',
        verticalAlign,
        mediaSize ? `plus-media-${mediaSize}` : '',
        className
    ].filter(Boolean).join(' ');

    const renderMedia = () => {
        const mediaClasses = 'plus-media-object' + (typeof media === 'string' ? ' plus-media-image' : ' plus-media-icon');

        return (
            <div className={mediaClasses}>
                {typeof media === 'string' ? <img src={media} alt={typeof heading === 'string' ? heading : 'Media'} /> : media}
            </div>
        );
    };

    const styles = onClick ? { cursor: 'pointer' } : {};

    return (
        <div className={containerClasses} onClick={onClick} style={{ ...styles, ...props.style }} {...props}>
            {!isRight && renderMedia()}

            <div className="media-body plus-media-body">
                {heading && <h6 className="mt-0 plus-media-heading">{heading}</h6>}
                <div className="plus-media-content body1-txt">
                    {children}
                </div>
            </div>

            {isRight && renderMedia()}
        </div>
    );
};

MediaObject.propTypes = {
    media: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    heading: PropTypes.node,
    children: PropTypes.node.isRequired,
    alignment: PropTypes.oneOf(['left', 'left-center', 'left-bottom', 'right', 'right-center', 'right-bottom']),
    mediaSize: PropTypes.oneOf(['small', 'default', 'large']),
    className: PropTypes.string,
    onClick: PropTypes.func,
    style: PropTypes.object
};

export default MediaObject;
