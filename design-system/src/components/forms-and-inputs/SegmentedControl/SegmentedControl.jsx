import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
 * the selected segment at rest and glides to the new one on a spatial spring;
 * under reduced motion it fades in there. It is measured, so it follows the track and
 * the segments when the container resizes, the fonts load or the options change.
 *
 * @param {object} props
 * @param {string} props.label - The group's accessible name ("Format").
 * @param {{value: string, label: string, icon?: string|React.ReactNode, isIconOnly?: boolean, isDisabled?: boolean}[]} props.options - Two to five segments; six when every segment is icon-only.
 * @param {string} [props.value] - Controlled selected value. Keep it set, or leave it out, for the life of the control.
 * @param {string} [props.defaultValue] - Starting value of an uncontrolled control; the first enabled option when omitted.
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
    const [own, setOwn] = useState(value ?? defaultValue ?? options.find((o) => !o.isDisabled)?.value);
    // A controlled value is mirrored into `own`, so a control that stops being controlled keeps the last choice rather than jumping back.
    if (isControlled && own !== value) setOwn(value);
    const wasControlled = useRef(isControlled);
    useEffect(() => {
        if (wasControlled.current !== isControlled) {
            warn('`value` switched between set and unset; keep it set (controlled) or unset (uncontrolled) for the life of the control.');
            wasControlled.current = isControlled;
        }
    }, [isControlled]);
    const selected = isControlled ? value : own;

    const iconOnlyCount = options.filter((o) => o.isIconOnly).length;
    const limit = iconOnlyCount === options.length ? MAX_ICON_ONLY_SEGMENTS : MAX_SEGMENTS;
    if (options.length > limit) {
        warn(`${options.length} segments is more than ${limit}; use Tabs or a Select for a longer list.`);
    }
    if (!label) warn('`label` names the group for assistive technology; pass it.');

    const rootRef = useRef(null);
    const indicatorRef = useRef(null);
    const shownRef = useRef(null);
    const animRef = useRef(null);
    const reduced = useMotionReduced();
    const reducedRef = useRef(reduced);
    reducedRef.current = reduced;
    const lastActiveRef = useRef(null);

    // Required selection: pressing the selected segment would empty the group, so that change is dropped.
    const handleValueChange = (next) => {
        const [picked] = next;
        if (picked === undefined || picked === selected) return;
        if (!isControlled) setOwn(picked);
        onChange?.(picked);
    };

    const paint = useCallback((box) => {
        const el = indicatorRef.current;
        if (!el) return;
        el.style.transform = `translate(${box.x}px, ${box.y}px)`;
        el.style.width = `${box.width}px`;
        el.style.height = `${box.height}px`;
        el.dataset.ready = 'true';
        shownRef.current = box;
    }, []);

    /*
     * Put the indicator under the selected segment. Everything that can move a
     * segment (a selection, a resize, a font, new options) comes through here.
     * `glide` is true only for a change of selection; a measurement alone jumps.
     * A change that arrives mid-glide starts the next glide from where the
     * indicator is drawn now, so it re-targets instead of snapping.
     */
    const place = useCallback((glide) => {
        const rootEl = rootRef.current;
        if (!rootEl || !indicatorRef.current) return;
        const activeEl = rootEl.querySelector('[aria-pressed="true"]');
        if (!activeEl) {
            delete indicatorRef.current.dataset.ready;
            shownRef.current = null;
            return;
        }
        const target = { x: activeEl.offsetLeft, y: activeEl.offsetTop, width: activeEl.offsetWidth, height: activeEl.offsetHeight };
        const from = shownRef.current;
        const moving = animRef.current !== null;
        if (!from || reducedRef.current || (!glide && !moving)) {
            animRef.current?.stop?.();
            animRef.current = null;
            paint(target);
            if (from && glide && reducedRef.current) {
                indicatorRef.current.dataset.fade = indicatorRef.current.dataset.fade === 'on' ? 'off' : 'on';
            }
            return;
        }
        animRef.current?.stop?.();
        const start = { ...from };
        const anim = animate(0, 1, {
            ...SPRINGS['spatial.fast'].productive,
            onUpdate: (p) => {
                const lerp = (a, b) => a + (b - a) * p;
                paint({ x: lerp(start.x, target.x), y: lerp(start.y, target.y), width: Math.max(0, lerp(start.width, target.width)), height: Math.max(0, lerp(start.height, target.height)) });
            },
        });
        animRef.current = anim;
        Promise.resolve(anim.finished).then(() => {
            if (animRef.current !== anim) return;
            animRef.current = null;
            paint(target);
        });
    }, [paint]);

    const optionsKey = options.map((o) => `${o.value}|${o.label}|${o.icon && typeof o.icon === 'string' ? o.icon : ''}|${o.isIconOnly ? 1 : 0}`).join(',');

    // After every render that can change what is selected or how wide a segment is.
    useLayoutEffect(() => {
        const changed = lastActiveRef.current !== null && lastActiveRef.current !== selected;
        lastActiveRef.current = selected;
        place(changed);
    }, [selected, optionsKey, spacing, shouldFitContainer, place]);

    // Follow the track and each segment when they resize, and once the fonts are in.
    useEffect(() => {
        const rootEl = rootRef.current;
        if (!rootEl) return undefined;
        let live = true;
        const remeasure = () => { if (live) place(false); };
        let observer;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(remeasure);
            observer.observe(rootEl);
            rootEl.querySelectorAll('.plus-segmented-control__item').forEach((el) => observer.observe(el));
        }
        document.fonts?.ready?.then(remeasure);
        return () => {
            live = false;
            observer?.disconnect();
        };
    }, [optionsKey, place]);

    useEffect(() => () => { animRef.current?.stop?.(); }, []);

    useLayoutEffect(() => {
        if (!reduced && indicatorRef.current) delete indicatorRef.current.dataset.fade;
    }, [reduced]);

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
    /** The segments: two to five, or up to six when every segment is icon-only (one text segment makes it five). Each is `{ value, label, icon, isIconOnly, isDisabled }`; an icon-only segment draws just the icon and shows `label` in a Tooltip and as its accessible name. */
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        isIconOnly: PropTypes.bool,
        isDisabled: PropTypes.bool,
    })).isRequired,
    /** The selected segment's value. Pair it with `onChange`; when set, `defaultValue` is ignored. Keep it set, or leave it out, for the life of the control. */
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
