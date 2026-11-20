import React, { useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
import { animate } from 'motion/react';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { useMotionReduced } from '@/lib/motionPreference';
import { devWarn } from '@/lib/devWarn';
import Icon from '../../images-and-icons/Icon';
import Tooltip from '../../overlays-and-layering/Tooltip/Tooltip';
import './SegmentedControl.scss';

const warn = devWarn('SegmentedControl');

export const SEGMENTED_CONTROL_SPACINGS = ['default', 'compact'];
const MAX_SEGMENTS = 5;
const MAX_ICON_ONLY_SEGMENTS = 6;

/**
 * Segmented control: switches how the same content is shown (Table / Cards,
 * Day / Week / Month, Form / Code). Exactly one segment is selected and the
 * view changes at once, with no apply step.
 *
 * Built on Base UI's ToggleGroup, single and required: a group of toggle
 * buttons with `aria-pressed`, not a radiogroup or a tablist. Arrow keys move
 * between segments; Space or Enter selects. One raised indicator sits under
 * the selected segment and glides to the new one on a spatial spring; under
 * reduced motion it does not glide.
 *
 * @param {object} props
 * @param {string} props.label - The group's accessible name ("Format").
 * @param {{value: string, label: string, icon?: string|React.ReactNode, isIconOnly?: boolean, isDisabled?: boolean}[]} props.options
 * @param {string} [props.value] - Controlled selected value.
 * @param {string} [props.defaultValue] - Starting value of an uncontrolled control; the first option when omitted.
 * @param {(value: string) => void} [props.onChange]
 * @param {'default'|'compact'} [props.spacing='default']
 * @param {boolean} [props.shouldFitContainer=false]
 * @param {boolean} [props.isDisabled=false]
 */
const SegmentedControl = ({
    label,
    options = [],
    value,
    defaultValue,
    onChange,
    spacing = 'default',
    shouldFitContainer = false,
    isDisabled = false,
    className,
    testId,
    ...props
}) => {
    const isControlled = value !== undefined;
    const [own, setOwn] = useState(defaultValue ?? options.find((o) => !o.isDisabled)?.value);
    const selected = isControlled ? value : own;

    const iconOnlyCount = options.filter((o) => o.isIconOnly).length;
    const limit = iconOnlyCount === options.length ? MAX_ICON_ONLY_SEGMENTS : MAX_SEGMENTS;
    if (options.length > limit) {
        warn(`${options.length} segments is more than ${limit}; use Tabs or a Select for a longer list.`);
    }
    if (!label) warn('`label` names the group for assistive technology; pass it.');

    const rootRef = useRef(null);
    const indicatorRef = useRef(null);
    const mountedRef = useRef(false);
    const lastRef = useRef(null);
    const animRef = useRef(null);
    const reduced = useMotionReduced();

    // Required selection: pressing the selected segment would empty the group, so that change is dropped.
    const handleValueChange = (next) => {
        const [picked] = next;
        if (picked === undefined || picked === selected) return;
        if (!isControlled) setOwn(picked);
        onChange?.(picked);
    };

    useLayoutEffect(() => {
        const rootEl = rootRef.current;
        const indicatorEl = indicatorRef.current;
        if (!rootEl || !indicatorEl) return undefined;
        const activeEl = rootEl.querySelector('[aria-pressed="true"]');
        if (!activeEl) {
            lastRef.current = null;
            return undefined;
        }
        const readBox = (el) => ({ el, x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
        const next = readBox(activeEl);
        if (!mountedRef.current) {
            mountedRef.current = true;
            lastRef.current = next;
            return undefined;
        }
        const prev = lastRef.current;
        if (!prev || prev.el === activeEl) {
            if (!rootEl.dataset.gliding) lastRef.current = next;
            return undefined;
        }
        animRef.current?.stop?.();
        if (reduced) {
            delete rootEl.dataset.gliding;
            lastRef.current = next;
            return undefined;
        }
        rootEl.dataset.gliding = 'true';
        const from = { ...prev };
        const apply = (p) => {
            const lerp = (a, b) => a + (b - a) * p;
            const x = lerp(from.x, next.x);
            const w = Math.max(0, lerp(from.width, next.width));
            indicatorEl.style.transform = `translate(${x}px, ${next.y}px)`;
            indicatorEl.style.width = `${w}px`;
            indicatorEl.style.height = `${next.height}px`;
            lastRef.current = { el: activeEl, x, y: next.y, width: w, height: next.height };
        };
        apply(0);
        const anim = animate(0, 1, { ...SPRINGS['spatial.fast'].productive, onUpdate: apply });
        animRef.current = anim;
        Promise.resolve(anim.finished).then(() => {
            if (animRef.current !== anim) return;
            animRef.current = null;
            delete rootEl.dataset.gliding;
            lastRef.current = readBox(activeEl);
        });
        return undefined;
    });

    useLayoutEffect(() => () => { animRef.current?.stop?.(); }, []);

    const renderSegment = (option) => {
        const glyph = option.icon
            ? <span className="plus-segmented-control__icon">{typeof option.icon === 'string' ? <Icon name={option.icon} /> : option.icon}</span>
            : null;
        const iconOnly = Boolean(option.isIconOnly && option.icon);
        const segment = (
            <Toggle
                key={option.value}
                value={option.value}
                disabled={option.isDisabled}
                aria-label={iconOnly ? option.label : undefined}
                className={clsx('plus-segmented-control__item', iconOnly && 'plus-segmented-control__item--icon-only')}
            >
                {glyph}
                {!iconOnly && <span className="plus-segmented-control__text">{option.label}</span>}
            </Toggle>
        );
        return iconOnly && !option.isDisabled ? <Tooltip key={option.value} text={option.label}>{segment}</Tooltip> : segment;
    };

    return (
        <ToggleGroup
            ref={rootRef}
            value={selected === undefined ? [] : [selected]}
            onValueChange={handleValueChange}
            disabled={isDisabled}
            aria-label={label}
            className={clsx(
                'plus-segmented-control',
                `plus-segmented-control--spacing-${spacing}`,
                shouldFitContainer && 'plus-segmented-control--fit-container',
                className,
            )}
            data-testid={testId}
            {...props}
        >
            <span ref={indicatorRef} className="plus-segmented-control__indicator" aria-hidden="true" />
            {options.map(renderSegment)}
        </ToggleGroup>
    );
};

SegmentedControl.propTypes = {
    /** The group's accessible name, such as "Format". Required: the control has no visible title of its own. */
    label: PropTypes.string.isRequired,
    /** The segments, two to five (six when all are icon-only). Each is `{ value, label, icon, isIconOnly, isDisabled }`; an icon-only segment draws just the icon and shows `label` in a Tooltip and as its accessible name. */
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        isIconOnly: PropTypes.bool,
        isDisabled: PropTypes.bool,
    })).isRequired,
    /** The selected segment's value. Pair it with `onChange`; when set, `defaultValue` is ignored. */
    value: PropTypes.string,
    /** Starting value of an uncontrolled control. Defaults to the first enabled segment. */
    defaultValue: PropTypes.string,
    /** Called with the chosen segment's value when the person picks a different segment. */
    onChange: PropTypes.func,
    /** `default` draws a 32 control. `compact` draws 24. */
    spacing: PropTypes.oneOf(SEGMENTED_CONTROL_SPACINGS),
    /** Segments share the width of the container equally, for a narrow slot. */
    shouldFitContainer: PropTypes.bool,
    /** Prevents interaction with every segment. */
    isDisabled: PropTypes.bool,
    /** Extra class on the group. */
    className: PropTypes.string,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default SegmentedControl;
