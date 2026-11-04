import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button/Button';
import { Fieldset, Checkbox, TextField, Select } from '@/components';

/**
 * RequestTutorOffCanvas — the "Request tutor(s)" / "Request lead tutor" side sheet triggered
 * from the in-session Session Controls overflow menu.
 *
 * Figma: `Request / Off-Canvas Sidebar` (6065:66287). Full-height 400px right side sheet.
 *
 * Two flows, chosen by `role`:
 *  - **lead** (3 steps): request form (number of tutors, closing time, reason) → Slack preview → sent.
 *  - **tutor** (2 steps): Slack preview (request a lead tutor) → sent.
 *
 * Tokens (from Figma variable defs):
 *  - Title `Title/H5` (Lato SemiBold 20, --color-on-surface); subtitle Merriweather Sans Light 14, --color-on-surface-variant.
 *  - Required `*`: --color-danger. Primary CTA: --color-primary / on-primary. Sent state: --color-success.
 *  - Card pad 24 (--size-card-pad-*-lg), section gap 16 (--size-card-gap), radius 6 (--size-modal-radius-md).
 */

const CLOSING_TIMES = ['12:05', '12:15', '12:30', '12:45'];
/** Later closing times, offered under "Other". */
const OTHER_CLOSING_TIMES = ['1:00', '1:15', '1:30'];

const REASONS = [
    { id: 'fewer-tutors', label: 'Fewer tutors than expected' },
    { id: 'more-students', label: 'More students than expected' },
    { id: 'need-support', label: 'Students need additional support' },
];

/** −  [n]  +  stepper (Figma `Request / Number of Tutors`, 1–5). */
const NumberStepper = ({ value, min = 1, max = 5, onChange }) => {
    const btn = (icon, disabled, onClick, label) => (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            style={{
                width: '32px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                border: `var(--stroke-1) solid var(--color-outline-variant)`,
                background: 'var(--ds-surface)',
                color: disabled ? 'var(--color-outline-variant)' : 'var(--ds-text)',
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
        >
            <i className={`fa-solid fa-${icon}`} style={{ fontSize: 'var(--font-size-fa-body2-solid)' }} />
        </button>
    );
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-0625)' }}>
            {btn('minus', value <= min, () => onChange(Math.max(min, value - 1)), 'Decrease')}
            <span className="body1-txt font-weight-semibold" style={{ minWidth: '1.5em', textAlign: 'center', color: 'var(--ds-text)' }}>
                {value}
            </span>
            {btn('plus', value >= max, () => onChange(Math.min(max, value + 1)), 'Increase')}
        </div>
    );
};

/** Selectable time / choice chip. */
const Chip = ({ selected, children, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="body2-txt"
        style={{
            padding: 'var(--space-025) var(--pad-x-md)',
            borderRadius: 'var(--radius-full, 999px)',
            border: `var(--stroke-1) solid ${selected ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
            background: selected ? 'var(--color-primary)' : 'var(--ds-background-neutral)',
            color: selected ? 'var(--color-on-primary)' : 'var(--ds-text)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
        }}
    >
        {children}
    </button>
);

const FieldLabel = ({ children, required }) => (
    <label className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)', display: 'block' }}>
        {children}
        {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
    </label>
);

/** Slack message preview card — mirrors the message that will post to the channel. */
const SlackPreview = ({ role, session, tutorCount, closesAt, reason }) => (
    <div
        style={{
            border: `var(--stroke-1) solid var(--color-outline-variant)`,
            borderRadius: 'var(--size-card-radius-sm)',
            background: 'var(--ds-surface)',
            padding: 'var(--size-card-pad-y-md, 16px) var(--size-card-pad-x-md, 16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-0625)',
        }}
    >
        <span className="body1-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
            🟥 Need {tutorCount} {role === 'lead' ? (tutorCount > 1 ? 'tutors' : 'tutor') : 'lead tutor'} ASAP
        </span>
        <div className="body3-txt" style={{ color: 'var(--ds-text-subtle)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span><strong style={{ color: 'var(--ds-text)' }}>Time:</strong> {session.time}</span>
            <span><strong style={{ color: 'var(--ds-text)' }}>Class:</strong> {session.class}</span>
            <span><strong style={{ color: 'var(--ds-text)' }}>Teacher:</strong> {session.teacher}</span>
            {role === 'lead' && closesAt && (
                <span><strong style={{ color: 'var(--ds-text)' }}>Request closes:</strong> {closesAt}</span>
            )}
            {role === 'lead' && reason && (
                <span><strong style={{ color: 'var(--ds-text)' }}>Reason:</strong> {reason}</span>
            )}
        </div>
        <div className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>
            If you can cover this:{' '}
            <span style={{ display: 'block' }}>1. React with ✅ so others know it&apos;s covered.</span>
            <span style={{ display: 'block' }}>2. Fill in for the session here: <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--color-primary-text)' }}>session link</a></span>
        </div>
    </div>
);

export const RequestTutorOffCanvas = ({
    role = 'lead',
    open = true,
    onClose = () => {},
    channel = '#tutors-spring-2026',
    session = { time: '12:00 – 1:00pm', class: 'Algebra I', teacher: 'Prof. Snape' },
    onSend = () => {},
}) => {
    const isLead = role === 'lead';
    // Step model: lead → 'form' | 'preview' | 'sent'; tutor → 'preview' | 'sent'.
    const [step, setStep] = useState(isLead ? 'form' : 'preview');
    const [tutorCount, setTutorCount] = useState(1);
    const [closesAt, setClosesAt] = useState('12:45');
    const [reasons, setReasons] = useState([]);
    const [otherReason, setOtherReason] = useState('');

    if (!open) return null;

    const selectedReasonLabel = (() => {
        const picked = REASONS.filter((r) => reasons.includes(r.id)).map((r) => r.label);
        if (reasons.includes('other') && otherReason) picked.push(otherReason);
        return picked.join(', ') || 'Tutor did not show up';
    })();

    const sent = step === 'sent';

    const Header = ({ title, subtitle }) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-0625)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <h5 className="h5" style={{ color: 'var(--ds-text)', margin: 0 }}>{title}</h5>
                {subtitle && <p className="body2-txt" style={{ color: 'var(--ds-text-subtlest)', margin: 0 }}>{subtitle}</p>}
            </div>
            <button type="button" aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--ds-text-subtlest)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: 'var(--font-size-fa-h6-solid)' }} />
            </button>
        </div>
    );

    const Footer = ({ primary }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-0625)', borderTop: `var(--stroke-1) solid var(--color-outline-variant)`, paddingTop: 'var(--size-card-pad-y-md, 16px)' }}>
            <Button text="Exit" appearance="subtle" onClick={onClose} />
            {primary}
        </div>
    );

    // Body per step ---------------------------------------------------------
    let title, subtitle, body, footer;

    if (isLead && step === 'form') {
        title = 'Request tutor';
        subtitle = `Post a request to the PLUS Tutors ${channel} channel.`;
        body = (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-0625)' }}>
                    <FieldLabel required>Number of tutors</FieldLabel>
                    <NumberStepper value={tutorCount} onChange={setTutorCount} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-0625)' }}>
                    <FieldLabel required>Request closes at</FieldLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-md)', alignItems: 'center' }}>
                        {CLOSING_TIMES.map((t) => (
                            <Chip key={t} selected={closesAt === t} onClick={() => setClosesAt(t)}>{t}pm</Chip>
                        ))}
                        <Select
                            aria-label="Other closing time"
                            clearable={false}
                            placeholder="Other"
                            spacing="compact"
                            options={OTHER_CLOSING_TIMES.map((t) => ({ value: t, label: `${t}pm` }))}
                            value={OTHER_CLOSING_TIMES.includes(closesAt) ? closesAt : ''}
                            onChange={setClosesAt}
                            style={{ width: '8rem' }}
                        />
                    </div>
                </div>
                <Fieldset
                    id="request-reason"
                    legend={<span className="font-weight-semibold">Reason for request</span>}
                    style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}
                >
                    {REASONS.map((reason) => (
                        <Checkbox
                            key={reason.id}
                            name="request-reason"
                            value={reason.id}
                            label={reason.label}
                            isChecked={reasons.includes(reason.id)}
                            onChange={(event) => {
                                const without = reasons.filter((v) => v !== reason.id);
                                setReasons(event.target.checked ? [...without, reason.id] : without);
                            }}
                        />
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--stack-md)' }}>
                        <Checkbox
                            name="request-reason"
                            value="other"
                            label="Other"
                            isChecked={reasons.includes('other')}
                            onChange={(event) => {
                                const without = reasons.filter((v) => v !== 'other');
                                setReasons(event.target.checked ? [...without, 'other'] : without);
                            }}
                        />
                        <TextField
                            id="request-reason-other-text"
                            label="Other, please specify"
                            isLabelHidden
                            spacing="compact"
                            placeholder="Tell us more…"
                            value={otherReason}
                            onChange={(event) => {
                                setOtherReason(event.target.value);
                                // Writing an answer chooses it.
                                if (event.target.value && !reasons.includes('other')) {
                                    setReasons([...reasons, 'other']);
                                }
                            }}
                        />
                    </div>
                </Fieldset>
            </>
        );
        footer = <Footer primary={<Button text="Next" appearance="primary" iconAfter="arrow-right" onClick={() => setStep('preview')} />} />;
    } else {
        // preview / sent — same for both roles (tutor starts here)
        title = 'Send message to Slack';
        subtitle = `Notify the PLUS Tutors via the ${channel} channel.`;
        body = (
            <SlackPreview
                role={role}
                session={session}
                tutorCount={isLead ? tutorCount : 1}
                closesAt={isLead ? `${closesAt}pm` : null}
                reason={isLead ? selectedReasonLabel : null}
            />
        );
        footer = (
            <Footer
                primary={
                    <Button
                        text={sent ? 'Sent to Slack' : 'Send to Slack'}
                        appearance="primary"
                        iconBefore={sent ? 'check' : 'paper-plane'}
                        onClick={() => {
                            if (sent) return;
                            setStep('sent');
                            onSend({ role, tutorCount, closesAt, reason: selectedReasonLabel });
                        }}
                    />
                }
            />
        );
    }

    return (
        <div
            role="dialog"
            aria-label={isLead ? 'Request tutor' : 'Request lead tutor'}
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '400px',
                maxWidth: '100%',
                background: 'var(--ds-surface)',
                borderLeft: `var(--stroke-1) solid var(--color-outline-variant)`,
                boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-card-gap, 16px)',
                padding: 'var(--size-card-pad-y-lg, 24px) var(--size-card-pad-x-lg, 24px)',
                zIndex: 'var(--layer-dialog)',
                boxSizing: 'border-box',
            }}
        >
            <Header title={title} subtitle={subtitle} />
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap, 16px)' }}>
                {body}
            </div>
            {footer}
        </div>
    );
};

RequestTutorOffCanvas.propTypes = {
    /** 'lead' → full request form (3 steps); 'tutor' → request a lead tutor (2 steps). */
    role: PropTypes.oneOf(['lead', 'tutor']),
    open: PropTypes.bool,
    onClose: PropTypes.func,
    channel: PropTypes.string,
    session: PropTypes.shape({ time: PropTypes.string, class: PropTypes.string, teacher: PropTypes.string }),
    onSend: PropTypes.func,
};

export default RequestTutorOffCanvas;
