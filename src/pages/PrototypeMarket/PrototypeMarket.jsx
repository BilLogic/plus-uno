import React, { useState, useMemo, useEffect, useRef } from 'react';
import Select from '@/components/forms-and-inputs/Select';
import TextField from '@/components/forms-and-inputs/TextField/TextField';
import StatusTag from '@/components/labels/StatusTag';
import { Button, IconButton } from '@/components';
import ButtonGroup from '@/components/forms-and-inputs/ButtonGroup';
import PrototypeCard from './PrototypeCard';
import {
  prototypes,
  STAGES,
  PRODUCT_PILLARS,
  STAGE_META,
  PILLAR_META,
} from './prototypes-data';
import './PrototypeMarket.scss';

const stageOptions = STAGES.map((s) => ({ value: s, label: STAGE_META[s].label }));
const pillarOptions = PRODUCT_PILLARS.map((p) => ({ value: p, label: PILLAR_META[p].label }));
const fidelityRank = { low: 1, mid: 2, high: 3 };

// Derive unique creators from data
const CREATORS = [...new Set(prototypes.flatMap((p) => p.creators))].sort();
const creatorOptions = CREATORS.map((c) => ({ value: c, label: c }));

/**
 * Parse a Loom share URL into an embed URL.
 * https://www.loom.com/share/abc123 → https://www.loom.com/embed/abc123
 */
function toLoomEmbed(url) {
  if (!url) return null;
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (match) return `https://www.loom.com/embed/${match[1]}`;
  if (url.includes('loom.com/embed/')) return url;
  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getPrototypeOpenUrl(proto) {
  if (!proto) return null;
  if (proto.deploymentUrl) return proto.deploymentUrl;
  if (proto.localPath) return proto.localPath;
  return null;
}

function getUpvoteButtonLabel(count) {
  return count > 0 ? String(count) : 'Upvote';
}

const PrototypeMarket = () => {
  const [search, setSearch] = useState('');
  const [selectedStages, setSelectedStages] = useState([]);
  const [selectedPillars, setSelectedPillars] = useState([]);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('time');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activePrototype, setActivePrototype] = useState(null);
  const [upvoteCounts, setUpvoteCounts] = useState(() =>
    Object.fromEntries(prototypes.map((p) => [p.id, p.upvotes ?? 0]))
  );
  const [upvotedIds, setUpvotedIds] = useState(() => new Set());
  /** Mirrors upvotedIds so toggle can read current value without nesting setState (Strict Mode double-invokes updaters). */
  const upvotedIdsRef = useRef(upvotedIds);
  upvotedIdsRef.current = upvotedIds;
  const lastOpenedRef = useRef({ url: '', ts: 0 });
  const [missingPreviews, setMissingPreviews] = useState(() => new Set());
  const [commentsById, setCommentsById] = useState(() =>
    Object.fromEntries(
      prototypes.map((p) => [
        p.id,
        [{ author: 'Cynthia', timestamp: 'Mar 23, 2026, 5:20 PM', content: 'Message content here.' }],
      ])
    )
  );
  const [pendingComment, setPendingComment] = useState('');

  // Break out of demo frame when marketplace is active
  useEffect(() => {
    document.documentElement.classList.add('market-active');
    document.body.classList.add('market-active');
    return () => {
      document.documentElement.classList.remove('market-active');
      document.body.classList.remove('market-active');
    };
  }, []);

  useEffect(() => {
    if (!activePrototype) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setActivePrototype(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePrototype]);

  const normalizedSearch = search.trim();
  const hasFilters = selectedStages.length > 0 || selectedPillars.length > 0 || selectedCreators.length > 0 || normalizedSearch;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = prototypes.filter((p) => {
      if (selectedStages.length > 0 && !selectedStages.includes(p.stage)) return false;
      if (selectedPillars.length > 0 && !selectedPillars.includes(p.productPillar)) return false;
      if (selectedCreators.length > 0 && !p.creators.some((c) => selectedCreators.includes(c))) return false;
      if (q) {
        const haystack = [
          p.title,
          p.description,
          ...p.creators,
          ...p.contributors,
          p.productPillar,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return base;
  }, [search, selectedStages, selectedPillars, selectedCreators]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'fidelity') {
        const rankDelta = fidelityRank[a.stage] - fidelityRank[b.stage];
        if (rankDelta !== 0) {
          return sortDirection === 'asc' ? rankDelta : -rankDelta;
        }
        const dateDelta = new Date(a.lastUpdated) - new Date(b.lastUpdated);
        return sortDirection === 'asc' ? dateDelta : -dateDelta;
      }

      const dateDelta = new Date(a.lastUpdated) - new Date(b.lastUpdated);
      if (dateDelta !== 0) {
        return sortDirection === 'asc' ? dateDelta : -dateDelta;
      }
      const rankDelta = fidelityRank[a.stage] - fidelityRank[b.stage];
      return sortDirection === 'asc' ? rankDelta : -rankDelta;
    });
  }, [filtered, sortBy, sortDirection]);

  const handleSortClick = (nextSortBy) => {
    if (sortBy === nextSortBy) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortBy(nextSortBy);
    setSortDirection('desc');
  };

  const toggleUpvote = (prototypeId) => {
    const hasUpvoted = upvotedIdsRef.current.has(prototypeId);
    setUpvoteCounts((counts) => ({
      ...counts,
      [prototypeId]: Math.max(0, (counts[prototypeId] || 0) + (hasUpvoted ? -1 : 1)),
    }));
    setUpvotedIds((prev) => {
      const next = new Set(prev);
      if (hasUpvoted) next.delete(prototypeId);
      else next.add(prototypeId);
      return next;
    });
  };

  const submitComment = () => {
    if (!activePrototype) return;
    const text = pendingComment.trim();
    if (!text) return;
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    setCommentsById((prev) => ({
      ...prev,
      [activePrototype.id]: [...(prev[activePrototype.id] || []), { author: 'Cynthia', timestamp, content: text }],
    }));
    setPendingComment('');
  };

  const openPrototypeInNewTab = (proto, event) => {
    event?.preventDefault();
    event?.stopPropagation();
    const target = getPrototypeOpenUrl(proto);
    if (!target) return;
    const resolvedUrl = target.startsWith('http') ? target : `${window.location.origin}${target}`;
    const now = Date.now();
    // Guard against duplicate click/event dispatch opening two tabs.
    if (lastOpenedRef.current.url === resolvedUrl && now - lastOpenedRef.current.ts < 700) return;
    lastOpenedRef.current = { url: resolvedUrl, ts: now };
    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="prototype-market">
      {/* Header */}
      <header className="prototype-market__header">
        <h1 className="prototype-market__title heading-xxlarge">Prototype Market</h1>
        <p className="prototype-market__subtitle body-large">
          Browse deployed PLUS prototypes. Each card links to its live deployment or local dev route.
        </p>
      </header>

      {/* Search — using the DS Text field */}
      <TextField
        id="market-search"
        placeholder="Search prototypes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        elemBefore={<i className="fa-solid fa-magnifying-glass" aria-hidden="true" />}
        isLabelHidden
        label="Search prototypes"
      />

      {/* Filters */}
      <div className="prototype-market__filters">
        <div className="prototype-market__filter-group">
          <label className="prototype-market__filter-label body-small">Stage</label>
          <Select
            id="market-stage-filter"
            aria-label="Stage"
            isMulti
            options={stageOptions}
            value={selectedStages}
            onChange={setSelectedStages}
            placeholder="All stages"
          />
        </div>

        <div className="prototype-market__filter-group">
          <label className="prototype-market__filter-label body-small">Pillar</label>
          <Select
            id="market-pillar-filter"
            aria-label="Pillar"
            isMulti
            options={pillarOptions}
            value={selectedPillars}
            onChange={setSelectedPillars}
            placeholder="All pillars"
          />
        </div>

        <div className="prototype-market__filter-group">
          <label className="prototype-market__filter-label body-small">Creator</label>
          <Select
            id="market-creator-filter"
            aria-label="Creator"
            isMulti
            options={creatorOptions}
            value={selectedCreators}
            onChange={setSelectedCreators}
            placeholder="All creators"
          />
        </div>

        <div className="prototype-market__sorts" aria-label="Sort controls">
          <Button
            text="Time"
            spacing="compact"
            isSelected={sortBy === 'time'}
            iconAfter={<i className={`fa-solid ${sortBy === 'time' && sortDirection === 'asc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />}
            onClick={() => handleSortClick('time')}
            aria-pressed={sortBy === 'time'}
            className="prototype-market__sort-btn"
          />
          <Button
            text="Fidelity"
            spacing="compact"
            isSelected={sortBy === 'fidelity'}
            iconAfter={<i className={`fa-solid ${sortBy === 'fidelity' && sortDirection === 'asc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />}
            onClick={() => handleSortClick('fidelity')}
            aria-pressed={sortBy === 'fidelity'}
            className="prototype-market__sort-btn"
          />
        </div>
      </div>

      {/* Result count + view toggle */}
      <div className="prototype-market__toolbar">
        <div className="prototype-market__count body-default">
          {normalizedSearch ? (
            <>
              Search result:{' '}
              <span className="prototype-market__count-emphasis">{sorted.length}</span>{' '}
              {sorted.length === 1 ? 'prototype' : 'prototypes'} for{' '}
              <span className="prototype-market__count-emphasis">{normalizedSearch}</span>
            </>
          ) : (
            <>
              {sorted.length} {sorted.length === 1 ? 'prototype' : 'prototypes'}
            </>
          )}
          {hasFilters && (
            <Button
              text="Clear filter"
              appearance="subtle"
              spacing="compact"
              onClick={() => {
                setSelectedStages([]);
                setSelectedPillars([]);
                setSelectedCreators([]);
                setSearch('');
              }}
            />
          )}
        </div>
        <ButtonGroup label="View mode">
          <IconButton
            icon="grip"
            label="Grid view"
            spacing="compact"
            isSelected={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          />
          <IconButton
            icon="list"
            label="List view"
            spacing="compact"
            isSelected={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          />
        </ButtonGroup>
      </div>

      {/* Grid or List */}
      {filtered.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="prototype-market__grid">
            {sorted.map((proto) => (
              <PrototypeCard
                key={proto.id}
                {...proto}
                upvoteCount={upvoteCounts[proto.id] || 0}
                isUpvoted={upvotedIds.has(proto.id)}
                onToggleUpvote={() => toggleUpvote(proto.id)}
                onOpenDetails={() => setActivePrototype(proto)}
              />
            ))}
          </div>
        ) : (
          <div className="prototype-market__list">
            <div className="prototype-market__list-header body-small">
              <span className="prototype-market__list-col--name">Name</span>
              <span className="prototype-market__list-col--pillar">Pillar</span>
              <span className="prototype-market__list-col--stage">Stage</span>
              <span className="prototype-market__list-col--creator">Creator</span>
              <span className="prototype-market__list-col--date">Updated</span>
              <span className="prototype-market__list-col--link">Link</span>
            </div>
            {sorted.map((proto) => {
              const stageMeta = STAGE_META[proto.stage] || STAGE_META.low;
              const pillarMeta = PILLAR_META[proto.productPillar] || PILLAR_META.universal;
              const link = proto.deploymentUrl || proto.localPath;
              const RowTag = link ? 'a' : 'div';
              const rowProps = link ? {
                href: link,
                target: proto.deploymentUrl ? '_blank' : undefined,
                rel: proto.deploymentUrl ? 'noopener noreferrer' : undefined,
              } : {};
              return (
                <RowTag
                  key={proto.id}
                  className="prototype-market__list-row body-default"
                  {...rowProps}
                >
                  <span className="prototype-market__list-col--name">
                    <strong>{proto.title}</strong>
                    <span className="prototype-market__list-desc">{proto.description}</span>
                  </span>
                  <span className="prototype-market__list-col--pillar">
                    <StatusTag appearance={pillarMeta.badgeStyle}>{pillarMeta.label}</StatusTag>
                  </span>
                  <span className="prototype-market__list-col--stage">
                    <StatusTag appearance={stageMeta.badgeStyle}>{stageMeta.label}</StatusTag>
                  </span>
                  <span className="prototype-market__list-col--creator">{proto.creators?.join(', ')}</span>
                  <span className="prototype-market__list-col--date">{proto.lastUpdated}</span>
                  <span className="prototype-market__list-col--link">
                    {link ? <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /> : <i className="fa-solid fa-circle-minus" aria-hidden="true" style={{ opacity: 0.3 }} />}
                  </span>
                </RowTag>
              );
            })}
          </div>
        )
      ) : (
        <div className="prototype-market__empty">
          <i className="fa-regular fa-folder-open prototype-market__empty-icon" aria-hidden="true" />
          <p className="body-large">No prototypes match your filters.</p>
        </div>
      )}

      {activePrototype && (
        <div className="prototype-market__modal-backdrop" onClick={() => setActivePrototype(null)}>
          <div
            className="prototype-market__modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${activePrototype.title} details`}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              className="prototype-market__modal-close"
              appearance="subtle"
              icon="xmark"
              onClick={() => setActivePrototype(null)}
              label="Close details"
            />

            <div className="prototype-market__modal-top">
              <div className="prototype-market__modal-header-main">
                <div className="prototype-market__modal-badges">
                  <StatusTag appearance={(STAGE_META[activePrototype.stage] || STAGE_META.low).badgeStyle}>
                    {(STAGE_META[activePrototype.stage] || STAGE_META.low).label}
                  </StatusTag>
                  <StatusTag appearance={(PILLAR_META[activePrototype.productPillar] || PILLAR_META.universal).badgeStyle}>
                    {(PILLAR_META[activePrototype.productPillar] || PILLAR_META.universal).label}
                  </StatusTag>
                </div>
                <h3 className="prototype-market__modal-title heading-xlarge">{activePrototype.title}</h3>
              </div>

              <div className="prototype-market__modal-actions">
                {getPrototypeOpenUrl(activePrototype) && (
                  <Button
                    className="prototype-market__modal-open-prototype"
                    appearance="primary"
                    text="Open prototype"
                    iconAfter={<i className="fa-solid fa-arrow-up-right-from-square" />}
                    onClick={(e) => openPrototypeInNewTab(activePrototype, e)}
                  />
                )}
                <Button
                  className="prototype-market__modal-upvote"
                  isSelected={upvotedIds.has(activePrototype.id)}
                  iconBefore={<i className={`${upvotedIds.has(activePrototype.id) ? 'fa-solid' : 'fa-regular'} fa-thumbs-up`} />}
                  text={getUpvoteButtonLabel(upvoteCounts[activePrototype.id] || 0)}
                  onClick={() => toggleUpvote(activePrototype.id)}
                />
              </div>
            </div>

            <div className="prototype-market__modal-meta body-default">
              <span><i className="fa-regular fa-user" /> {activePrototype.creators?.join(', ') || 'User name'}</span>
              <span><i className="fa-regular fa-calendar" /> {formatDate(activePrototype.lastUpdated)}</span>
            </div>

            <div className="prototype-market__modal-links body-default">
              {activePrototype.localPath && (
                <a href={activePrototype.localPath}><i className="fa-solid fa-laptop" /> Local</a>
              )}
              {activePrototype.notionCardUrl && (
                <a href={activePrototype.notionCardUrl} target="_blank" rel="noopener noreferrer">
                  <i className="fa-brands fa-notion" /> {activePrototype.notionCardId || 'Notion'}
                </a>
              )}
              {activePrototype.loomVideoUrl && (
                <a href={activePrototype.loomVideoUrl} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-video" /> Loom Walkthrough
                </a>
              )}
            </div>

            <p className="prototype-market__modal-desc body-large">{activePrototype.description}</p>

            {toLoomEmbed(activePrototype.loomVideoUrl) && (
              <>
                <h5 className="prototype-market__modal-section heading-medium">Walkthrough</h5>
                <div className="prototype-market__modal-loom">
                  <iframe
                    src={toLoomEmbed(activePrototype.loomVideoUrl)}
                    frameBorder="0"
                    allowFullScreen
                    title={`${activePrototype.title} walkthrough video`}
                  />
                </div>
              </>
            )}
            <div className="prototype-market__divider" role="separator" />
            <h5 className="prototype-market__modal-section heading-medium">Comments</h5>
            <div className="prototype-market__modal-comments">
              {(commentsById[activePrototype.id] || []).map((comment, idx) => (
                <div key={`${activePrototype.id}-comment-${idx}`} className="prototype-market__modal-comment body-default">
                  <div className="prototype-market__modal-comment-head">
                    <strong>{comment.author}</strong> <span>{comment.timestamp}</span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
            <div className="prototype-market__modal-feedback-row">
              <TextField
                id="prototype-comment-input"
                className="prototype-market__modal-feedback-input"
                placeholder="Share your feedback"
                isLabelHidden
                label="Share your feedback"
                value={pendingComment}
                onChange={(e) => setPendingComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitComment();
                  }
                }}
              />
              <IconButton
                className="prototype-market__modal-send"
                appearance="primary"
                icon="paper-plane"
                onClick={submitComment}
                isDisabled={!pendingComment.trim()}
                label="Send comment"
              />
            </div>
            <div className="prototype-market__divider" role="separator" />
            <h5 className="prototype-market__modal-section heading-medium">Preview</h5>
            <div className="prototype-market__modal-preview">
              {getPrototypeOpenUrl(activePrototype) ? (
                <div
                  className="prototype-market__modal-preview-link"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => openPrototypeInNewTab(activePrototype, e)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPrototypeInNewTab(activePrototype, e); } }}
                >
                  {missingPreviews.has(activePrototype.id) ? (
                    <div className="prototype-market__modal-preview-fallback body-default">
                      Preview image is generating. Run `npm run generate:previews` to refresh snapshots.
                    </div>
                  ) : (
                    <img
                      src={`/prototype-previews/${activePrototype.id}.png?v=${encodeURIComponent(activePrototype.lastUpdated || 'latest')}`}
                      alt={`${activePrototype.title} preview`}
                      className="prototype-market__modal-preview-image"
                      onError={() => {
                        setMissingPreviews((prev) => {
                          if (prev.has(activePrototype.id)) return prev;
                          const next = new Set(prev);
                          next.add(activePrototype.id);
                          return next;
                        });
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="prototype-market__modal-preview-fallback body-default">
                  No prototype link available for preview.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrototypeMarket;
