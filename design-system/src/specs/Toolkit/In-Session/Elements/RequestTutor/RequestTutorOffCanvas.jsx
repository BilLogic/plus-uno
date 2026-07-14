import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button/Button';
import Checkbox from '@/components/forms-and-inputs/Checkbox';
import Dropdown from '@/components/forms-and-inputs/Dropdown/Dropdown';

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

const REASONS = [
    { id: 'fewer-tutors', label: 'Fewer tutors than expected' },
    { id: 'more-students', label: 'More students than expected' },
    { id: 'need-support', label: 'Students need additional support' },
    { id: 'other', label: 'Other' },
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
                borderRadius: 'var(--size-element-radius-md)',
                border: `var(--size-element-stroke-sm) solid var(--color-outline-variant)`,
                background: 'var(--color-surface-container-lowest)',
                color: disabled ? 'var(--color-outline-variant)' : 'var(--color-on-surface)',
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
        >
            <i className={`fa-solid fa-${icon}`} style={{ fontSize: 'var(--font-size-fa-b2-solid)' }} />
        </button>
    );
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--size-element-gap-md)' }}>
            {btn('minus', value <= min, () => onChange(Math.max(min, value - 1)), 'Decrease')}
            <span className="body1-txt font-weight-semibold" style={{ minWidth: '1.5em', textAlign: 'center', color: 'var(--color-on-surface)' }}>
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
            padding: 'var(--size-element-pad-y-sm) var(--size-element-pad-x-md)',
            borderRadius: 'var(--size-element-radius-full, 999px)',
            border: `var(--size-element-stroke-sm) solid ${selected ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
            background: selected ? 'var(--color-primary)' : 'var(--color-secondary-state-08)',
            color: selected ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
        }}
    >
        {children}
    </button>
);

const FieldLabel = ({ children, required }) => (
    <label className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)', display: 'block' }}>
        {children}
        {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
    </label>
);

/** Slack message preview card — mirrors the message that will post to the channel. */
const SlackPreview = ({ role, session, tutorCount, closesAt, reason }) => (
    <div
        style={{
            border: `var(--size-element-stroke-sm) solid var(--color-outline-variant)`,
            borderRadius: 'var(--size-card-radius-sm)',
            background: 'var(--color-surface-container-lowest)',
            padding: 'var(--size-card-pad-y-md, 16px) var(--size-card-pad-x-md, 16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-md)',
        }}
    >
        <span className="body1-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
            🟥 Need {tutorCount} {role === 'lead' ? (tutorCount > 1 ? 'tutors' : 'tutor') : 'lead tutor'} ASAP
        </span>
        <div className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span><strong style={{ color: 'var(--color-on-surface)' }}>Time:</strong> {session.time}</span>
            <span><strong style={{ color: 'var(--color-on-surface)' }}>Class:</strong> {session.class}</span>
            <span><strong style={{ color: 'var(--color-on-surface)' }}>Teacher:</strong> {session.teacher}</span>
            {role === 'lead' && closesAt && (
                <span><strong style={{ color: 'var(--color-on-surface)' }}>Request closes:</strong> {closesAt}</span>
            )}
            {role === 'lead' && reason && (
                <span><strong style={{ color: 'var(--color-on-surface)' }}>Reason:</strong> {reason}</span>
            )}
        </div>
        <div className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
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
    const [reasons, setReasons] = useState({});
    const [otherReason, setOtherReason] = useState('');

    if (!open) return null;

    const selectedReasonLabel = (() => {
        const picked = REASONS.filter((r) => reasons[r.id] && r.id !== 'other').map((r) => r.label);
        if (reasons.other && otherReason) picked.push(otherReason);
        return picked.join(', ') || 'Tutor did not show up';
    })();

    const sent = step === 'sent';

    const Header = ({ title, subtitle }) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--size-element-gap-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                <h5 className="h5" style={{ color: 'var(--color-on-surface)', margin: 0 }}>{title}</h5>
                {subtitle && <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>{subtitle}</p>}
            </div>
            <button type="button" aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-on-surface-variant)' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: 'var(--font-size-fa-h6-solid)' }} />
            </button>
        </div>
    );

    const Footer = ({ primary }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--size-element-gap-md)', borderTop: `var(--size-element-stroke-sm) solid var(--color-outline-variant)`, paddingTop: 'var(--size-card-pad-y-md, 16px)' }}>
            <Button text="Exit" style="secondary" fill="ghost" size="medium" onClick={onClose} />
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                    <FieldLabel required>Number of tutors</FieldLabel>
                    <NumberStepper value={tutorCount} onChange={setTutorCount} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                    <FieldLabel required>Request closes at</FieldLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--size-element-gap-sm)', alignItems: 'center' }}>
                        {CLOSING_TIMES.map((t) => (
                            <Chip key={t} selected={closesAt === t} onClick={() => setClosesAt(t)}>{t}pm</Chip>
                        ))}
                        <Dropdown
                            buttonText="Other"
                            size="small"
                            style="secondary"
                            fill="outline"
                            items={['1:00', '1:15', '1:30'].map((t) => ({ label: `${t}pm`, selected: closesAt === t, onClick: () => setClosesAt(t) }))}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                    <FieldLabel>Reason for request</FieldLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                        {REASONS.map((r) => (
                            <Checkbox
                                key={r.id}
                                label={r.label}
                                checked={!!reasons[r.id]}
                                onChange={(e) => setReasons((prev) => ({ ...prev, [r.id]: e?.target ? e.target.checked : !prev[r.id] }))}
                            />
                        ))}
                        {reasons.other && (
                            <input
                                type="text"
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                placeholder="Tell us more…"
                                className="body2-txt"
                                style={{
                                    padding: 'var(--size-element-pad-y-sm) var(--size-element-pad-x-md)',
                                    borderRadius: 'var(--size-element-radius-md)',
                                    border: `var(--size-element-stroke-sm) solid var(--color-outline-variant)`,
                                    background: 'var(--color-surface-container-lowest)',
                                    color: 'var(--color-on-surface)',
                                }}
                            />
                        )}
                    </div>
                </div>
            </>
        );
        footer = <Footer primary={<Button text="Next" style="primary" fill="filled" size="medium" trailingVisual="arrow-right" onClick={() => setStep('preview')} />} />;
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
                        style={sent ? 'success' : 'primary'}
                        fill="filled"
                        size="medium"
                        leadingVisual={sent ? 'check' : 'paper-plane'}
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
                background: 'var(--color-surface)',
                borderLeft: `var(--size-element-stroke-sm) solid var(--color-outline-variant)`,
                boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-card-gap, 16px)',
                padding: 'var(--size-card-pad-y-lg, 24px) var(--size-card-pad-x-lg, 24px)',
                zIndex: 1200,
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
