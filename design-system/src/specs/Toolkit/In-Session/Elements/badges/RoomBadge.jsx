import React from 'react';
import PropTypes from 'prop-types';

/**
 * RoomBadge — the per-student breakout-room chip shown at the start of the student
 * row's Name cell.
 *
 * Figma: `Student / Info Badges` → `type=room #` (6995:70523), out-of-range 10046:4.
 * Renders `#{number}` (no icon) in the secondary tone. It is HIDDEN until the student
 * has been assigned to a tutor (Room Numbering v2), i.e. when `number` is null/undefined.
 *
 * The `outOfRange` variant is shown when a student overflows their tutor's frozen number
 * block and has to borrow a number from elsewhere — it switches to the danger tone and
 * adds a small warning indicator, matching the Figma "room # (out of range)" variant.
 *
 * Tokens (from Figma variable defs):
 *  - default: bg --color-secondary-state-08 (#445c6a14), text --color-secondary-text (#3b525f)
 *  - out of range: bg --color-danger-state-08, text --color-danger-text
 *  - radius --size-element-radius-md (4px), pad-x --size-element-pad-x-sm (8px), height 20px, gap 4px
 */
export const RoomBadge = ({ number, outOfRange = false }) => {
    if (number === null || number === undefined || number === '') return null;

    const tone = outOfRange
        ? { bg: 'var(--color-danger-state-08)', fg: 'var(--color-danger-text)' }
        : { bg: 'var(--color-secondary-state-08)', fg: 'var(--color-secondary-text)' };

    return (
        <span
            className="body3-txt"
            title={
                outOfRange
                    ? `Zoom breakout room: ${number} (out of range)`
                    : `Zoom breakout room: ${number}`
            }
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-sm, 4px)',
                flexShrink: 0,
                height: '20px',
                padding: '0 var(--size-element-pad-x-sm)',
                borderRadius: 'var(--size-element-radius-md)',
                backgroundColor: tone.bg,
                color: tone.fg,
                whiteSpace: 'nowrap',
                lineHeight: 1,
            }}
        >
            {outOfRange && (
                <i
                    className="fa-solid fa-triangle-exclamation"
                    style={{ fontSize: 'var(--font-size-fa-b3-solid, 10px)' }}
                    aria-hidden="true"
                />
            )}
            #{number}
        </span>
    );
};

RoomBadge.propTypes = {
    /** Breakout room number. When null/undefined the badge is hidden (student not yet assigned). */
    number: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** True when the student had to borrow a number outside their tutor's block. */
    outOfRange: PropTypes.bool,
};

export default RoomBadge;
