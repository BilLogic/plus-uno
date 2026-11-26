import React from 'react';
import PropTypes from 'prop-types';
import { devWarn } from '../../../lib/devWarn';

import CountTag, { COUNT_TAG_APPEARANCES, formatCount } from '../CountTag/CountTag';
import { ClippedTooltip } from '../../../lib/ClippedTooltip';
import Icon from '../../images-and-icons/Icon';
import Spinner from '../../loading/Spinner/Spinner';
import DropdownMenu from '@/components/forms-and-inputs/DropdownMenu';
import useTagOpen from '../useTagOpen';
import './StatusTag.scss';

/**
 * `StatusTag` — the condition something is in.
 *
 * WHICH LABEL, IN FOUR QUESTIONS. Is it a number? Count tag. Is it a due or
 * event date? Date tag. Is it the condition something is in, and can that
 * condition change? Status tag, whether the system calculated it or a person
 * set it. Otherwise, Tag (or CompetencyTag for a competency area). A Status tag is
 * filled (a meaning); Tag is outlined (a category).
 *
 * THE NAMES FOLLOW THE LIBRARY. `appearance`, `spacing`, `iconBefore` and
 * `trailingMetric` take the same words Button and Count tag use, and the same
 * values as the Status tag set in Figma, so handoff needs no translation.
 *
 * A STATUS TAG IS A LABEL UNTIL IT HAS A `menu`. Without one it is a `span`
 * with no role and no click handler; the one time it takes focus is when its
 * text is truncated, so a keyboard user can reach the tooltip that holds the
 * full text. With `menu` (rows of `ButtonItem`) the same tag is the trigger of
 * a `DropdownMenu`: a real button, with a chevron, that opens the other
 * statuses in place. Use it where a person changes the status in a row;
 * everywhere else it stays a label.
 */

export const STATUS_TAG_APPEARANCES = ['neutral', 'success', 'warning', 'danger', 'info', 'discovery'];
export const STATUS_TAG_MATERIALS = ['bold', 'subtle'];
/** The material color token each appearance takes; neutral has none, since a neutral status is never colored material. */
const MATERIAL_COLOR_OF = { success: 'success', warning: 'warning', danger: 'danger', info: 'information', discovery: 'discovery' };
export const STATUS_TAG_SPACINGS = ['default', 'spacious'];

const warn = devWarn('StatusTag');

/** Whether the tag is a menu trigger, `menu` being any renderable node but `false`, `null` or nothing. */
const hasMenu = (menu) => menu !== undefined && menu !== null && menu !== false;

/** A filled label for the condition something is in, such as "Needs review" or "Overdue". It is never a button; its appearance carries the meaning. */
export const StatusTag = ({
    children,
    appearance = 'neutral',
    spacing = 'default',
    material,
    iconBefore,
    trailingMetric,
    trailingMetricAppearance,
    maxWidth = 200,
    menu,
    isOpen,
    defaultOpen,
    onOpenChange,
    isLoading = false,
    isDisabled = false,
    className = '',
    id,
    onClick,
    role,
    tabIndex,
    ...rest
}) => {
    /*
     * Anything that would make it a control is dropped, not passed through: a
     * click handler, a role, a tab stop. Whether it takes focus is decided by
     * truncation alone.
     */
    const isMenu = hasMenu(menu);
    // The tag owns the open state so the chevron can follow it; the menu is
    // handed it back as a controlled `isOpen`.
    const { isOpen: open, setOpen } = useTagOpen({ isOpen, defaultOpen, onOpenChange });
    for (const [name, value] of [['onClick', onClick], ['role', role], ['tabIndex', tabIndex]]) {
        if (value !== undefined) {
            warn(`\`${name}\` is ignored: a Status tag is a label. Give it a \`menu\` to let a person change the status in place.`);
        }
    }
    if (!isMenu) {
        for (const [name, value] of [['isOpen', isOpen], ['defaultOpen', defaultOpen], ['onOpenChange', onOpenChange], ['isLoading', isLoading || undefined], ['isDisabled', isDisabled || undefined]]) {
            if (value !== undefined) warn(`\`${name}\` does nothing without a \`menu\`.`);
        }
    }

    let effectiveAppearance = appearance;
    if (!STATUS_TAG_APPEARANCES.includes(effectiveAppearance)) {
        warn(`appearance="${appearance}" is not one of ${STATUS_TAG_APPEARANCES.join(', ')}; it falls back to neutral.`);
        effectiveAppearance = 'neutral';
    }

    let effectiveSpacing = spacing;
    if (!STATUS_TAG_SPACINGS.includes(spacing)) {
        warn(`spacing="${spacing}" is not one of ${STATUS_TAG_SPACINGS.join(', ')}; it falls back to default.`);
        effectiveSpacing = 'default';
    }

    let materialColor = null;
    if (material !== undefined) {
        if (!STATUS_TAG_MATERIALS.includes(material)) {
            warn(`material="${material}" is not one of ${STATUS_TAG_MATERIALS.join(', ')}; it is ignored.`);
        } else if (!(effectiveAppearance in MATERIAL_COLOR_OF)) {
            warn(`material needs a colored appearance (${Object.keys(MATERIAL_COLOR_OF).join(', ')}); it is ignored on neutral.`);
        } else {
            materialColor = MATERIAL_COLOR_OF[effectiveAppearance];
        }
    }

    const wantsMetric = trailingMetric !== undefined && trailingMetric !== null && formatCount(trailingMetric) !== null;
    let metricAppearance = effectiveAppearance;
    if (trailingMetricAppearance !== undefined) {
        if (COUNT_TAG_APPEARANCES.includes(trailingMetricAppearance)) metricAppearance = trailingMetricAppearance;
        else warn(`trailingMetricAppearance="${trailingMetricAppearance}" is not one of ${COUNT_TAG_APPEARANCES.join(', ')}; it follows appearance.`);
    }

    const classes = [
        'plus-status',
        `plus-status--${effectiveAppearance}`,
        `plus-status--${effectiveSpacing}`,
        materialColor ? `plus-status--material-${material} plus-status--material-${materialColor}` : '',
        wantsMetric ? 'plus-status--with-count' : '',
        isMenu ? 'plus-status--menu' : '',
        isMenu && isLoading ? 'plus-status--loading' : '',
        className,
    ].filter(Boolean).join(' ');

    if (isMenu) {
        if (!rest['aria-label']) {
            warn('A Status tag with a `menu` needs an `aria-label` naming the field and the record: "Attendance, Hermione Granger: Present".');
        }
        const cap = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
        const trigger = (
            <button
                type="button"
                id={id}
                className={classes}
                style={{ '--plus-status-max': cap }}
                aria-haspopup="menu"
                aria-busy={isLoading || undefined}
                disabled={isDisabled || isLoading}
                {...rest}
            >
                <span className="plus-status__content">
                    {iconBefore && (
                        <span className="plus-status__visual" aria-hidden="true"><Icon name={iconBefore} /></span>
                    )}
                    <span className="plus-status__label">{children}</span>
                </span>
                {wantsMetric && (
                    <CountTag value={trailingMetric} appearance={metricAppearance} />
                )}
                <span className="plus-status__chevron" aria-hidden="true">
                    <Icon name={open ? 'angle-up' : 'angle-down'} iconStyle="solid" />
                </span>
                {isLoading && (
                    <span className="plus-status__spinner" aria-hidden="true">
                        <Spinner size={effectiveSpacing === 'spacious' ? 16 : 12} appearance="inherit" label="" />
                    </span>
                )}
            </button>
        );
        return (
            <DropdownMenu
                trigger={trigger}
                isOpen={open}
                onOpenChange={setOpen}
            >
                {menu}
            </DropdownMenu>
        );
    }

    /*
     * `maxWidth` travels as a custom property, not an inline `max-width`, so
     * the stylesheet can also clamp to the container: a Status tag in a column
     * narrower than its cap truncates instead of overflowing.
     *
     * The tooltip is always mounted and switched on only while the label is
     * clipped, so the element a person is focused on never remounts under them
     * when the page resizes.
     */
    return (
        <ClippedTooltip
            text={children}
            deps={[effectiveSpacing, maxWidth, iconBefore, wantsMetric]}
        >
            {({ measureRef, truncated }) => (
                <span
                    id={id}
                    className={classes}
                    style={{ '--plus-status-max': typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}
                    {...rest}
                    tabIndex={truncated ? 0 : undefined}
                >
                    <span className="plus-status__content">
                        {iconBefore && (
                            <span className="plus-status__visual" aria-hidden="true"><Icon name={iconBefore} /></span>
                        )}
                        <span
                            ref={measureRef}
                            className="plus-status__label"
                        >
                            {children}
                        </span>
                    </span>
                    {wantsMetric && (
                        <CountTag
                            value={trailingMetric}
                            appearance={metricAppearance}
                        />
                    )}
                </span>
            )}
        </ClippedTooltip>
    );
};

StatusTag.propTypes = {
    /** The status text, as people say it: "Needs review", "Due tomorrow". */
    children: PropTypes.node.isRequired,
    /** The meaning. Info is Tertiary; discovery is the curriculum purple. */
    appearance: PropTypes.oneOf(STATUS_TAG_APPEARANCES),
    /** `default` (20) in rows, lists and sentences; `spacious` (32) beside a heading. */
    spacing: PropTypes.oneOf(STATUS_TAG_SPACINGS),
    /** Colored material for a status over media or a material surface: bold or subtle, in the appearance's color. Not for neutral. */
    material: PropTypes.oneOf(STATUS_TAG_MATERIALS),
    /** One icon before the label: a Font Awesome Free name (`circle-check`). */
    iconBefore: PropTypes.string,
    /** A small count at the end of the tag, a 16 Count tag nested inside it. Hidden at 0. */
    trailingMetric: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** The Count tag's appearance. Defaults to the Status tag's own. */
    trailingMetricAppearance: PropTypes.oneOf(COUNT_TAG_APPEARANCES),
    /** The widest the Status tag grows, in px or any CSS length, and never wider than its container. Past it the label ends in an ellipsis and the full text is a tooltip. */
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** The menu's rows, `ButtonItem`s from `@/components`, the current one `isSelected`. With it the tag is a button that opens the menu; without it the tag is a label. Name it with `aria-label`: "Attendance, Hermione Granger: Present". */
    menu: PropTypes.node,
    /** Controlled open state of the menu. Pair it with `onOpenChange`. The open tag is drawn as selected. */
    isOpen: PropTypes.bool,
    /** Whether an uncontrolled menu starts open. */
    defaultOpen: PropTypes.bool,
    /** Called with the next open state when the menu opens or closes. */
    onOpenChange: PropTypes.func,
    /** A change is saving: the content hides, keeping its width, and a spinner draws over the tag. The tag cannot be pressed. */
    isLoading: PropTypes.bool,
    /** Prevents opening the menu. Drawn in the disabled tokens, never faded. */
    isDisabled: PropTypes.bool,
    /** Extra class names added to the tag element beside the component's own. */
    className: PropTypes.string,
    /** The `id` attribute of the tag element. */
    id: PropTypes.string,
};

export default StatusTag;
