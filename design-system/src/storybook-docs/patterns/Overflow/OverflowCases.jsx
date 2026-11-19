import React, { useState } from 'react';
import { Button } from '@/components';
import { Section } from '@/templates';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { StudentsTable } from '@/storybook-docs/lib/view-bar.jsx';
import { ClippedCell, clipStyle, LONG_TITLE } from './overflowDemo.jsx';

/**
 * The live do and don't examples on the Overflow pattern page, composed from
 * `Section`, `StudentsTable`, `ClippedCell`, `Button` and `CaseSurface`.
 */

const narrowSectionStyle = { maxInlineSize: 'var(--card-min-width-md)' };

/** Do: a long Section title wraps to a second line so the list stays named. */
export const WrappedSectionTitleCase = () => (
    <CaseSurface>
        <div style={narrowSectionStyle}>
            <Section title={LONG_TITLE}>
                <StudentsTable count={2} />
            </Section>
        </div>
    </CaseSurface>
);

/** Don't: cutting the Section title to one line hides what the list holds. */
export const ClippedSectionTitleCase = () => (
    <CaseSurface>
        <div style={narrowSectionStyle}>
            <Section title={<span style={clipStyle}>{LONG_TITLE}</span>}>
                <StudentsTable count={2} />
            </Section>
        </div>
    </CaseSurface>
);

/** Do: a clipped cell opens its full text in a Tooltip on hover and focus only while clipped. */
export const ClippedCellOpensTextCase = () => (
    <CaseSurface>
        <ClippedCell padded={false} />
    </CaseSurface>
);

/** Don't: a clipped cell without a Tooltip leaves the rest of the value unreadable. */
export const ClippedCellNoTextCase = () => (
    <CaseSurface>
        <ClippedCell padded={false} withTooltip={false} />
    </CaseSurface>
);

/** Do: a "Show n more" control names what is left and expands the list in place. */
export const ShowMoreWithCountCase = () => {
    const [expanded, setExpanded] = useState(false);
    return (
        <CaseSurface>
            <Section
                title="Students"
                footer={(
                    <Button
                        text={expanded ? 'Show less' : 'Show 4 more'}
                        appearance="subtle"
                        spacing="compact"
                        onClick={() => setExpanded((current) => !current)}
                    />
                )}
            >
                <StudentsTable count={expanded ? 6 : 2} />
            </Section>
        </CaseSurface>
    );
};

/** Don't: fading a list out hides how many items remain and gives no way to reveal them. */
export const FadedListCase = () => (
    <CaseSurface>
        <Section title="Students">
            <div
                style={{
                    maskImage: 'linear-gradient(to bottom, black 35%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 35%, transparent)',
                }}
            >
                <StudentsTable count={4} />
            </div>
        </Section>
    </CaseSurface>
);
