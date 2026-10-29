import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, Badge, Textarea, Dropdown } from '@/components';
import { TRANSCRIPTS, REASON_GROUPS, FLAG_CATEGORIES } from '../data';
import { categoryById, severityFor } from '../v2/audit';

const PRE_ROLL = 15; // seconds of context before a flagged line

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const savedMarker = (text) => (
    <Badge style="primary" text={text} leadingVisual={<i className="fa-solid fa-check" aria-hidden="true" />} />
);

/** Compliance picker shared by the Violation panel and the add-a-violation form. */
const ComplianceDropdown = ({ value, onChange, placeholder = 'Choose a compliance' }) => (
    <Dropdown
        buttonText={categoryById(value)?.name ?? placeholder}
        fill="outline"
        size="small"
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
        <div className="recording__add-form">
            <p className="body3-txt font-weight-semibold">
                New violation at {fmt(at)}
                {lineText && <span className="recording__muted"> · {lineText}</span>}
            </p>
            <ComplianceDropdown value={categoryId} onChange={setCategoryId} />
            <Textarea
                label="Notes"
                rows={2}
                placeholder="What did you see or hear?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />
            <div className="recording__annotate-submit">
                <Button
                    text="Add"
                    style="primary"
                    fill="filled"
                    size="small"
                    disabled={!categoryId}
                    onClick={() => onAdd({ at, categoryId, note, lineText })}
                />
                <Button text="Cancel" style="primary" fill="ghost" size="small" onClick={onCancel} />
            </div>
        </div>
    );
};

/** A violation the supervisor added, shown in the transcript where it happened. */
const AddedRow = ({ v, onRemove }) => (
    <div className="recording__added">
        <Badge style="primary" size="b3" text="Added by you" />
        <span className="body3-txt font-weight-semibold">{v.category}</span>
        {v.note && <span className="body3-txt recording__muted">{v.note}</span>}
        <button type="button" className="body3-txt recording__remove" onClick={() => onRemove(v.id)}>
            Remove
        </button>
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
        const box = el?.closest('.recording__lines');
        if (el && box) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2, behavior: 'smooth' });
    }, [currentIndex]);

    // The add form opens above the list and pushes it down; keep the line being
    // flagged in view so the supervisor can still see what they're adding to.
    useEffect(() => {
        if (!adding?.lineText) return;
        const el = document.querySelector('.recording__line-row.is-adding')?.closest('li');
        const box = el?.closest('.recording__lines');
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
        <div className="recording__annotate-submit">
            {saved ? savedMarker('Submitted') : (
                <Button
                    text={submitLabel()}
                    style="primary"
                    fill="filled"
                    size="medium"
                    disabled={!ready}
                    onClick={submit}
                />
            )}
            {!ready && <span className="body3-txt recording__muted">{hint}</span>}
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
        <div className="recording">
            <div className="recording__main">
                <Card paddingSize="lg" showBorder={false} className="compliance-surface">
                    <div className="recording__video">
                        <i className="fa-solid fa-video recording__video-icon" aria-hidden="true" />
                        <p className="body3-txt recording__muted">Recording preview · {category}</p>
                    </div>

                    <div className="recording__transport">
                        <Button
                            text={playing ? 'Pause' : 'Play'}
                            style="primary"
                            fill="outline"
                            size="small"
                            leadingVisual={playing ? 'pause' : 'play'}
                            onClick={() => setPlaying((p) => !p)}
                        />
                        <div className="recording__timeline" role="group" aria-label="Flagged moments">
                            <div className="recording__progress" style={{ width: `${(time / duration) * 100}%` }} />
                            {flagged.map((l) => (
                                <button
                                    key={l.at}
                                    type="button"
                                    className="recording__marker"
                                    style={{ left: `${(l.at / duration) * 100}%` }}
                                    onClick={() => seek(l.at)}
                                    aria-label={`Jump to flagged line at ${fmt(l.at)}`}
                                />
                            ))}
                            {added.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    className="recording__marker recording__marker--added"
                                    style={{ left: `${(v.at / duration) * 100}%` }}
                                    onClick={() => seek(v.at)}
                                    aria-label={`Jump to the violation you added at ${fmt(v.at)}`}
                                />
                            ))}
                        </div>
                        <p className="body3-txt recording__time">{fmt(time)} / {fmt(duration)}</p>
                    </div>
                </Card>

                <div className="compliance-surface recording__decision">
                    {isAdded && (
                        <div className="recording__claim">
                            <p className="body3-txt recording__kicker">Added by you · {flag.category} · at {fmt(flag.at)}</p>
                            <p className="h6 recording__claim-text">{flag.note || flag.lineText || 'No notes.'}</p>
                            <div className="recording__annotate-submit">
                                <Button
                                    text="Remove this violation"
                                    style="primary"
                                    fill="outline"
                                    size="small"
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
                        <div className="recording__claim">
                            <p className="body3-txt recording__kicker">No AI flag on this session</p>
                            <p className="body2-txt">
                                {added.length > 0
                                    ? `You added ${added.length} violation${added.length === 1 ? '' : 's'} on this session. They count as violations the AI missed.`
                                    : 'Found something? Use + on a transcript line, or Flag at the current time for anything that isn\'t on a line. If you found nothing, submit it as no violation.'}
                            </p>
                            <div className="recording__annotate-submit">
                                {added.length === 0 && cleanChecked ? savedMarker('Submitted: no violation found') : (
                                    <Button
                                        text={added.length > 0 ? submitLabel() : `No violation — ${submitLabel().toLowerCase()}`}
                                        style="primary"
                                        fill="filled"
                                        size="medium"
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
                            <div className="recording__claim">
                                <p className="body3-txt recording__kicker">
                                    AI flagged · {categoryById(aiCategoryId)?.name ?? category}
                                    {flag.patternPosition && (
                                        <>
                                            <span className="recording__dot" aria-hidden="true">·</span>
                                            {flag.patternPosition}
                                        </>
                                    )}
                                    <span className="recording__dot" aria-hidden="true">·</span>
                                    {Math.round(flag.confidence * 100)}% confidence
                                    {flag.severity && (
                                        <>
                                            <span className="recording__dot" aria-hidden="true">·</span>
                                            {flag.severity} severity
                                        </>
                                    )}
                                </p>
                                <p className="h6 recording__claim-text">{flag.quote}</p>
                                <div className="recording__stepper">
                                    <Button
                                        text="Previous"
                                        style="primary"
                                        fill="ghost"
                                        size="small"
                                        leadingVisual="arrow-left"
                                        disabled={flagged.length < 2}
                                        onClick={() => goToFlag(current - 1)}
                                    />
                                    <span className="body3-txt recording__counter">
                                        Flag {flagged.length ? current + 1 : 0} of {flagged.length}
                                        {flagged[current] && ` · ${fmt(flagged[current].at)}`}
                                    </span>
                                    <Button
                                        text="Next"
                                        style="primary"
                                        fill="ghost"
                                        size="small"
                                        trailingVisual="arrow-right"
                                        disabled={flagged.length < 2}
                                        onClick={() => goToFlag(current + 1)}
                                    />
                                </div>
                            </div>

                            {/* The verdict. Either button opens its panel; nothing is recorded until Submit. */}
                            <div className="recording__decision-actions">
                                {[['dismissed', 'Not a violation'], ['confirmed', 'Violation']].map(([key, label]) => (
                                    <Button
                                        key={key}
                                        text={label}
                                        style="primary"
                                        fill={choice === key ? 'filled' : 'outline'}
                                        size="medium"
                                        leadingVisual={choice === key ? 'check' : undefined}
                                        aria-pressed={choice === key}
                                        onClick={() => setChoice(key)}
                                    />
                                ))}
                            </div>

                            {choice === 'dismissed' && (
                                <div className="recording__annotate">
                                    <p className="body1-txt font-weight-semibold recording__annotate-label">
                                        Why was the AI wrong?
                                        <span className="recording__required" aria-hidden="true"> *</span>
                                    </p>
                                    <p className="body3-txt recording__muted">
                                        This is what the pipeline learns from — pick the closest reason, then add
                                        anything the reason misses.
                                    </p>
                                    <div className="recording__annotate-row">
                                        <Dropdown
                                            buttonText={reason || 'Choose a reason'}
                                            fill="outline"
                                            size="small"
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
                                    <Textarea
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
                                <div className="recording__annotate">
                                    <p className="body1-txt font-weight-semibold recording__annotate-label">
                                        Confirm the violation
                                    </p>
                                    <p className="body3-txt recording__muted">
                                        Check the compliance is right. Change it if the AI picked the wrong one.
                                    </p>
                                    <div className="recording__annotate-row">
                                        <p className="body3-txt recording__field-label">Compliance</p>
                                        <ComplianceDropdown value={categoryId} onChange={setCategoryId} />
                                        {relabelled && (
                                            <p className="body3-txt recording__muted recording__changed">
                                                Changed from the AI&apos;s pick: {categoryById(aiCategoryId)?.name}
                                                {severityFor(categoryId, isPattern) !== severityFor(aiCategoryId, isPattern)
                                                    && ` · Severity becomes ${severityFor(categoryId, isPattern)}`}
                                            </p>
                                        )}
                                    </div>
                                    <Textarea
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
            </div>

            <Card
                paddingSize="lg"
                showBorder={false}
                className={`compliance-surface recording__transcript${adding ? ' is-adding' : ''}`}
            >
                <div className="recording__transcript-head">
                    <div>
                        <h3 className="h5 compliance-chart-card__title">Transcript</h3>
                        <p className="body3-txt recording__muted">
                            {transcript.length} lines · {flagged.length} flagged by AI
                            {added.length > 0 && ` · ${added.length} added by you`}
                        </p>
                    </div>
                    <div className="recording__transcript-tools">
                        {/* For what isn't on a line: camera off, someone leaving, a skipped rotation. */}
                        <Button
                            text={`Flag at ${fmt(time)}`}
                            style="primary"
                            fill="outline"
                            size="small"
                            leadingVisual="plus"
                            onClick={() => {
                                setPlaying(false);
                                setAdding({ at: time, lineText: null });
                            }}
                        />
                        <Dropdown
                            buttonText={filter}
                            fill="outline"
                            size="small"
                            items={['All lines', 'Flagged only'].map((f) => ({
                                text: f,
                                selected: f === filter,
                                onClick: () => setFilter(f),
                            }))}
                        />
                    </div>
                </div>

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

                <ol className="recording__lines">
                    {shownRows.map((r) => {
                        if (r.kind === 'moment') {
                            return (
                                <li key={r.v.id} className="recording__moment">
                                    <span className="body3-txt recording__stamp">{fmt(r.v.at)}</span>
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
                                    className={`recording__line-row${isCurrent ? ' is-current' : ''}${l.flagged ? ' is-flagged' : ''}${adding?.lineText === lineText ? ' is-adding' : ''}`}
                                >
                                    <button
                                        type="button"
                                        className="recording__line"
                                        onClick={() => seek(l.at)}
                                    >
                                        <span className="body3-txt recording__stamp">{fmt(l.at)}</span>
                                        <span className="recording__text">
                                            <span className="body3-txt recording__speaker">{l.speaker}</span>
                                            <span className="body3-txt">{l.text}</span>
                                            {l.flagged && (
                                                <Badge style="danger" size="b3" text="Flagged" />
                                            )}
                                        </span>
                                    </button>
                                    {/* Only on the line under the pointer, so scrolling stays calm. */}
                                    <Button
                                        style="secondary"
                                        fill="ghost"
                                        size="small"
                                        leadingVisual="plus"
                                        className="recording__add-line"
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
            </Card>
        </div>
    );
};

export default RecordingPage;
