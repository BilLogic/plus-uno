import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AiIcon, Button, StatusTag, Tag, TextArea } from '@/components';
import OptionMenu from '../v2/OptionMenu';
import { PatternCard } from '@/patterns';
import { TRANSCRIPTS, REASON_GROUPS, FLAG_CATEGORIES } from '../data';
import { categoryById, severityFor } from '../v2/audit';
import './pages.css';

const PRE_ROLL = 15; // seconds of context before a flagged line

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Status styles are the new library's own words (success, danger), held as names.
const SAVED_STYLE = 'success';
const FLAGGED_STYLE = 'danger';

const savedMarker = (text) => (
    <StatusTag appearance={SAVED_STYLE} leadingVisual="check">{text}</StatusTag>
);

/** Compliance picker shared by the Violation panel and the add-a-violation form. */
const ComplianceDropdown = ({ value, onChange, placeholder = 'Choose a compliance' }) => (
    <OptionMenu
        buttonText={categoryById(value)?.name ?? placeholder}
        items={FLAG_CATEGORIES.map((c) => ({
            text: c.name,
            selected: c.id === value,
            onClick: () => onChange(c.id),
        }))}
    />
);

/**
 * The small form for a violation the AI didn't flag — under a transcript line,
 * or under the transcript header for a moment with no line.
 */
const AddViolationForm = ({ at, lineText, onAdd, onCancel }) => {
    const [categoryId, setCategoryId] = useState(null);
    const [note, setNote] = useState('');
    return (
        <div className="cm-add-form">
            <p className="cm-small cm-strong">
                New violation at {fmt(at)}
                {lineText && <span className="cm-muted"> · {lineText}</span>}
            </p>
            <ComplianceDropdown value={categoryId} onChange={setCategoryId} />
            <TextArea
                label="Notes"
                rows={2}
                placeholder="What did you see or hear?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />
            <div className="cm-submit">
                <Button
                    text="Add"
                    disabled={!categoryId}
                    onClick={() => onAdd({ at, categoryId, note, lineText })}
                />
                <Button text="Cancel" appearance="subtle" onClick={onCancel} />
            </div>
        </div>
    );
};

/** A violation the supervisor added, shown in the transcript where it happened. */
const AddedRow = ({ v, onRemove }) => (
    <div className="cm-added">
        <Tag color="blue" text="Added by you" />
        <span className="cm-strong">{v.category}</span>
        {v.note && <span className="cm-muted">{v.note}</span>}
        <Button text="Remove" appearance="subtle" onClick={() => onRemove(v.id)} />
    </div>
);

/**
 * Recording review, full page.
 *
 * Video and decision on the left, the whole transcript on the right. The
 * decision is two panels with one shape — a question, one dropdown, notes,
 * Submit — and the transcript is where a supervisor adds anything the AI
 * missed, so adding never depends on which verdict they picked.
 */
const RecordingPage = ({
    flag, category, decision, annotation, aiCategoryId, savedCategoryId,
    onSubmit, added = [], onAddViolation, onRemoveViolation, cleanChecked = false, onMarkClean,
    queue, onNext, onBack,
}) => {
    const transcript = TRANSCRIPTS[flag.transcriptId ?? flag.id] ?? [];
    const flagged = useMemo(() => transcript.filter((l) => l.flagged), [transcript]);
    const isAdded = flag.source === 'supervisor';
    const hasAiFlag = !isAdded && !flag.noAiFlag;

    const [time, setTime] = useState(flag.at ? Math.max(0, flag.at - PRE_ROLL) : 0);
    const [playing, setPlaying] = useState(false);
    const [filter, setFilter] = useState('All lines');
    const [current, setCurrent] = useState(0);
    // Opens on the recorded verdict, so a reviewed flag reopens with its panel showing.
    const [choice, setChoice] = useState(decision ?? null);
    const [reason, setReason] = useState(annotation?.reason ?? '');
    const [note, setNote] = useState(annotation?.note ?? '');
    const [categoryId, setCategoryId] = useState(savedCategoryId ?? aiCategoryId);
    // Where the add form is open: a transcript line's time, or 'now' under the header.
    const [adding, setAdding] = useState(null);
    const lineRefs = useRef({});

    const duration = flag.duration ?? 0;

    useEffect(() => {
        if (!playing) return undefined;
        const id = setInterval(() => {
            setTime((t) => {
                if (t >= duration) {
                    setPlaying(false);
                    return duration;
                }
                return t + 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [playing, duration]);

    const currentIndex = useMemo(() => {
        let idx = 0;
        transcript.forEach((l, i) => {
            if (l.at <= time) idx = i;
        });
        return idx;
    }, [time, transcript]);

    // Transcript follows the video — inside its own box, without moving the page.
    useEffect(() => {
        const el = lineRefs.current[currentIndex];
        const box = el?.closest('.cm-lines');
        if (el && box) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2, behavior: 'smooth' });
    }, [currentIndex]);

    // The add form opens above the list and pushes it down; keep the line being
    // flagged in view so the supervisor can still see what they're adding to.
    useEffect(() => {
        if (!adding?.lineText) return;
        const el = document.querySelector('.cm-line-row.is-adding')?.closest('li');
        const box = el?.closest('.cm-lines');
        if (!el || !box) return;
        const bottom = el.offsetTop + el.offsetHeight;
        if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight + 8;
        else if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop - 8;
    }, [adding]);

    const seek = (at) => {
        setTime(Math.max(0, at - PRE_ROLL));
        setPlaying(true);
    };

    const goToFlag = (i) => {
        const idx = ((i % flagged.length) + flagged.length) % flagged.length;
        setCurrent(idx);
        seek(flagged[idx].at);
    };

    // Saved = the panel shows exactly what was submitted.
    const edited = choice === 'dismissed'
        ? reason !== (annotation?.reason ?? '') || note !== (annotation?.note ?? '')
        : categoryId !== savedCategoryId || note !== (annotation?.note ?? '');
    const saved = Boolean(decision) && choice === decision && !edited;
    const relabelled = categoryId !== aiCategoryId;
    const isPattern = flag.tag === 'Pattern';

    // Submitting always moves on: to the next session waiting on a verdict, or,
    // when there isn't one, back to where the supervisor came from.
    const nextFlag = queue?.[0] ?? null;

    const submit = () => {
        onSubmit(choice === 'dismissed'
            ? { verdict: 'dismissed', reason, note, aiCategoryId }
            : { verdict: 'confirmed', categoryId, note, aiCategoryId });
        if (nextFlag) onNext(nextFlag);
        else onBack();
    };

    const submitLabel = () => (nextFlag ? 'Submit and next' : 'Submit and back');

    const submitRow = (ready, hint) => (
        <div className="cm-submit">
            {saved ? savedMarker('Submitted') : (
                <Button
                    text={submitLabel()}
                    disabled={!ready}
                    onClick={submit}
                />
            )}
            {!ready && <span className="cm-muted cm-small">{hint}</span>}
        </div>
    );

    // Added violations sit on their line; one found at a moment with no line
    // gets a row of its own at that time.
    const addedOnLine = (l) => added.filter((v) => v.lineText && v.at === l.at);
    const looseAdded = added.filter((v) => !transcript.some((l) => v.lineText && v.at === l.at));
    const rows = [
        ...transcript.map((l, i) => ({ kind: 'line', at: l.at, line: l, index: i })),
        ...looseAdded.map((v) => ({ kind: 'moment', at: v.at, v })),
    ].sort((a, b) => a.at - b.at || (a.kind === 'line' ? -1 : 1));
    const shownRows = filter === 'Flagged only'
        ? rows.filter((r) => r.kind === 'moment' || r.line.flagged || addedOnLine(r.line).length > 0)
        : rows;

    const addViolation = (v) => {
        onAddViolation(v);
        setAdding(null);
    };

    return (
        <div className="cm-recording">
            <div className="cm-stack">
                <PatternCard padding="lg">
                    <div className="cm-recording__video">
                        <i className="fa-solid fa-video cm-recording__video-icon" aria-hidden="true" />
                        <p className="cm-small">Recording preview · {category}</p>
                    </div>

                    <div className="cm-transport">
                        <Button
                            text={playing ? 'Pause' : 'Play'}
                            iconBefore={playing ? 'pause' : 'play'}
                            onClick={() => setPlaying((p) => !p)}
                        />
                        <div className="cm-timeline" role="group" aria-label="Flagged moments">
                            <div className="cm-timeline__progress" style={{ width: `${(time / duration) * 100}%` }} />
                            {flagged.map((l) => (
                                <button
                                    key={l.at}
                                    type="button"
                                    className="cm-marker"
                                    style={{ left: `${(l.at / duration) * 100}%` }}
                                    onClick={() => seek(l.at)}
                                    aria-label={`Jump to flagged line at ${fmt(l.at)}`}
                                />
                            ))}
                            {added.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    className="cm-marker cm-marker--added"
                                    style={{ left: `${(v.at / duration) * 100}%` }}
                                    onClick={() => seek(v.at)}
                                    aria-label={`Jump to the violation you added at ${fmt(v.at)}`}
                                />
                            ))}
                        </div>
                        <p className="cm-time">{fmt(time)} / {fmt(duration)}</p>
                    </div>
                </PatternCard>

                <PatternCard padding="lg">
                    <div className="cm-decision">
                        {isAdded && (
                            <div className="cm-claim">
                                <p className="cm-claim__label">Added by you · {flag.category} · at {fmt(flag.at)}</p>
                                <p className="cm-claim__text">{flag.note || flag.lineText || 'No notes.'}</p>
                                <div className="cm-submit">
                                    <Button
                                        text="Remove this violation"
                                        onClick={() => {
                                            onRemoveViolation(flag.id);
                                            onBack();
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* No AI flag: the supervisor either adds what the AI missed, or
                            submits the session as clean — a true negative in AI diagnosis. */}
                        {flag.noAiFlag && (
                            <div className="cm-claim">
                                <p className="cm-claim__label">No AI flag on this session</p>
                                <p className="cm-body">
                                    {added.length > 0
                                        ? `You added ${added.length} violation${added.length === 1 ? '' : 's'} on this session. They count as violations the AI missed.`
                                        : 'Found something? Use + on a transcript line, or Flag at the current time for anything that isn\'t on a line. If you found nothing, submit it as no violation.'}
                                </p>
                                <div className="cm-submit">
                                    {added.length === 0 && cleanChecked ? savedMarker('Submitted: no violation found') : (
                                        <Button
                                            text={added.length > 0 ? submitLabel() : `No violation — ${submitLabel().toLowerCase()}`}
                                            onClick={() => {
                                                if (added.length === 0) onMarkClean();
                                                if (nextFlag) onNext(nextFlag);
                                                else onBack();
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {hasAiFlag && (
                            <>
                                <div className="cm-claim">
                                    <p className="cm-claim__label">
                                        <AiIcon name="summarize" />
                                        <span>
                                            AI flagged · {categoryById(aiCategoryId)?.name ?? category}
                                            {flag.patternPosition && ` · ${flag.patternPosition}`}
                                            {` · ${Math.round(flag.confidence * 100)}% confidence`}
                                            {flag.severity && ` · ${flag.severity} severity`}
                                        </span>
                                    </p>
                                    <p className="cm-claim__text">{flag.quote}</p>
                                    <div className="cm-stepper">
                                        <Button
                                            text="Previous"
                                            appearance="subtle"
                                            iconBefore="arrow-left"
                                            disabled={flagged.length < 2}
                                            onClick={() => goToFlag(current - 1)}
                                        />
                                        <span className="cm-counter">
                                            Flag {flagged.length ? current + 1 : 0} of {flagged.length}
                                            {flagged[current] && ` · ${fmt(flagged[current].at)}`}
                                        </span>
                                        <Button
                                            text="Next"
                                            appearance="subtle"
                                            iconAfter="arrow-right"
                                            disabled={flagged.length < 2}
                                            onClick={() => goToFlag(current + 1)}
                                        />
                                    </div>
                                </div>

                                {/* The verdict. Either button opens its panel; nothing is recorded until Submit. */}
                                <div className="cm-verdict">
                                    {[['dismissed', 'Not a violation'], ['confirmed', 'Violation']].map(([key, label]) => (
                                        <Button
                                            key={key}
                                            text={label}
                                            appearance={choice === key ? 'primary' : 'default'}
                                            iconBefore={choice === key ? 'check' : undefined}
                                            aria-pressed={choice === key}
                                            onClick={() => setChoice(key)}
                                        />
                                    ))}
                                </div>

                                {choice === 'dismissed' && (
                                    <div className="cm-annotate">
                                        <p className="cm-annotate__title">
                                            Why was the AI wrong?
                                            <span className="cm-annotate__required" aria-hidden="true"> *</span>
                                        </p>
                                        <p className="cm-muted cm-small">
                                            This is what the pipeline learns from — pick the closest reason, then add
                                            anything the reason misses.
                                        </p>
                                        <div>
                                            <OptionMenu
                                                buttonText={reason || 'Choose a reason'}
                                                // Grouped by where the error came from, so the choice also
                                                // tells a developer which part of the pipeline to look at.
                                                items={REASON_GROUPS.flatMap((g) => [
                                                    { text: g.name, header: true, disabled: true },
                                                    ...g.reasons.map((r) => ({
                                                        text: r,
                                                        selected: r === reason,
                                                        onClick: () => setReason(r),
                                                    })),
                                                ])}
                                            />
                                        </div>
                                        <TextArea
                                            label="Notes"
                                            rows={2}
                                            placeholder="What did you see or hear that the AI missed?"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                        {submitRow(Boolean(reason), 'Choose a reason to submit.')}
                                    </div>
                                )}

                                {choice === 'confirmed' && (
                                    <div className="cm-annotate">
                                        <p className="cm-annotate__title">Confirm the violation</p>
                                        <p className="cm-muted cm-small">
                                            Check the compliance is right. Change it if the AI picked the wrong one.
                                        </p>
                                        <div>
                                            <p className="cm-field-label">Compliance</p>
                                            <ComplianceDropdown value={categoryId} onChange={setCategoryId} />
                                            {relabelled && (
                                                <p className="cm-muted cm-small">
                                                    Changed from the AI&apos;s pick: {categoryById(aiCategoryId)?.name}
                                                    {severityFor(categoryId, isPattern) !== severityFor(aiCategoryId, isPattern)
                                                        && ` · Severity becomes ${severityFor(categoryId, isPattern)}`}
                                                </p>
                                            )}
                                        </div>
                                        <TextArea
                                            label="Notes (optional)"
                                            rows={2}
                                            placeholder="What did you see or hear?"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                        {submitRow(true)}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </PatternCard>
            </div>

            <PatternCard
                padding="lg"
                className={`cm-transcript${adding ? ' is-adding' : ''}`}
                title="Transcript"
                description={`${transcript.length} lines · ${flagged.length} flagged by AI${added.length > 0 ? ` · ${added.length} added by you` : ''}`}
                actions={(
                    <div className="cm-transcript__head-tools">
                        {/* For what isn't on a line: camera off, someone leaving, a skipped rotation. */}
                        <Button
                            text={`Flag at ${fmt(time)}`}
                            iconBefore="plus"
                            onClick={() => {
                                setPlaying(false);
                                setAdding({ at: time, lineText: null });
                            }}
                        />
                        <OptionMenu
                            buttonText={filter}
                            items={['All lines', 'Flagged only'].map((f) => ({
                                text: f,
                                selected: f === filter,
                                onClick: () => setFilter(f),
                            }))}
                        />
                    </div>
                )}
            >
                {/* The form docks here, outside the scrolling list, so its compliance
                    menu opens over the transcript and is never clipped by the scroll box. */}
                {adding && (
                    <AddViolationForm
                        key={`${adding.at}-${adding.lineText ?? 'now'}`}
                        at={adding.at}
                        lineText={adding.lineText}
                        onAdd={addViolation}
                        onCancel={() => setAdding(null)}
                    />
                )}

                <ol className="cm-lines">
                    {shownRows.map((r) => {
                        if (r.kind === 'moment') {
                            return (
                                <li key={r.v.id} className="cm-moment">
                                    <span className="cm-stamp">{fmt(r.v.at)}</span>
                                    <AddedRow v={r.v} onRemove={onRemoveViolation} />
                                </li>
                            );
                        }
                        const l = r.line;
                        const i = r.index;
                        const isCurrent = i === currentIndex;
                        const onLine = addedOnLine(l);
                        const lineText = `${l.speaker}: ${l.text}`;
                        return (
                            <li key={l.at} ref={(el) => { lineRefs.current[i] = el; }}>
                                <div
                                    className={`cm-line-row${isCurrent ? ' is-current' : ''}${l.flagged ? ' is-flagged' : ''}${adding?.lineText === lineText ? ' is-adding' : ''}`}
                                >
                                    <button
                                        type="button"
                                        className="cm-line"
                                        onClick={() => seek(l.at)}
                                    >
                                        <span className="cm-stamp">{fmt(l.at)}</span>
                                        <span className="cm-line__text">
                                            <span className="cm-line__speaker">{l.speaker}</span>
                                            <span>{l.text}</span>
                                            {l.flagged && <StatusTag appearance={FLAGGED_STYLE}>Flagged</StatusTag>}
                                        </span>
                                    </button>
                                    {/* Only on the line under the pointer, so scrolling stays calm. */}
                                    <Button
                                        appearance="subtle"
                                        iconBefore="plus"
                                        className="cm-add-line"
                                        aria-label={`Add a violation at ${fmt(l.at)}`}
                                        title="Add a violation on this line"
                                        onClick={() => setAdding({ at: l.at, lineText })}
                                    />
                                </div>
                                {onLine.map((v) => (
                                    <AddedRow key={v.id} v={v} onRemove={onRemoveViolation} />
                                ))}
                            </li>
                        );
                    })}
                </ol>
            </PatternCard>
        </div>
    );
};

export default RecordingPage;
