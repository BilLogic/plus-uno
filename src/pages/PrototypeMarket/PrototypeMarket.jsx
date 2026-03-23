import React, { useState, useMemo, useEffect, useRef } from 'react';
import Select from '@/forms/Select';
import Input from '@/forms/Input';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import ButtonGroup from '@/components/ButtonGroup';
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
        <h1 className="prototype-market__title h2">Prototype Market</h1>
        <p className="prototype-market__subtitle body1-txt">
          Browse deployed PLUS prototypes. Each card links to its live deployment or local dev route.
        </p>
      </header>

      {/* Search — using DS Input component */}
      <Input
        id="market-search"
        placeholder="Search prototypes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leadingVisual="fa-solid fa-magnifying-glass"
        size="large"
        showLabel={false}
        label="Search prototypes"
      />

      {/* Filters */}
      <div className="prototype-market__filters">
        <div className="prototype-market__filter-group">
          <label className="prototype-market__filter-label body3-txt">Stage</label>
          <Select
            id="market-stage-filter"
            mode="multi"
            options={stageOptions}
            value={selectedStages}
            onChange={setSelectedStages}
            placeholder="All stages"
            size="medium"
          />
        </div>

        <div className="prototype-market__filter-group">
          <label className="prototype-market__filter-label body3-txt">Pillar</label>
          <Select
            id="market-pillar-filter"
            mode="multi"
            options={pillarOptions}
            value={selectedPillars}
            onChange={setSelectedPillars}
            placeholder="All pillars"
            size="medium"
          />
        </div>

        <div className="prototype-market__filter-group">
          <label className="prototype-market__filter-label body3-txt">Creator</label>
          <Select
            id="market-creator-filter"
            mode="multi"
            options={creatorOptions}
            value={selectedCreators}
            onChange={setSelectedCreators}
            placeholder="All creators"
            size="medium"
          />
        </div>

        <div className="prototype-market__sorts" aria-label="Sort controls">
          <button
            type="button"
            className={`prototype-market__sort-btn body3-txt ${sortBy === 'time' ? 'is-active' : ''}`}
            onClick={() => handleSortClick('time')}
            aria-pressed={sortBy === 'time'}
          >
            <span>Time</span>
            <i className={`fa-solid ${sortBy === 'time' && sortDirection === 'asc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
          </button>
          <button
            type="button"
            className={`prototype-market__sort-btn body3-txt ${sortBy === 'fidelity' ? 'is-active' : ''}`}
            onClick={() => handleSortClick('fidelity')}
            aria-pressed={sortBy === 'fidelity'}
          >
            <span>Fidelity</span>
            <i className={`fa-solid ${sortBy === 'fidelity' && sortDirection === 'asc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
          </button>
        </div>
      </div>

      {/* Result count + view toggle */}
      <div className="prototype-market__toolbar">
        <div className="prototype-market__count body2-txt">
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
              style="tertiary"
              fill="ghost"
              size="small"
              onClick={() => {
                setSelectedStages([]);
                setSelectedPillars([]);
                setSelectedCreators([]);
                setSearch('');
              }}
            />
          )}
        </div>
        <ButtonGroup
          size="small"
          style="secondary"
          fill="outline"
          ariaLabel="View mode"
          buttons={[
            {
              id: 'grid-view',
              leadingVisual: 'grip',
              active: viewMode === 'grid',
              onClick: () => setViewMode('grid'),
            },
            {
              id: 'list-view',
              leadingVisual: 'list',
              active: viewMode === 'list',
              onClick: () => setViewMode('list'),
            },
          ]}
        />
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
            <div className="prototype-market__list-header body3-txt">
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
                  className="prototype-market__list-row body2-txt"
                  {...rowProps}
                >
                  <span className="prototype-market__list-col--name">
                    <strong>{proto.title}</strong>
                    <span className="prototype-market__list-desc">{proto.description}</span>
                  </span>
                  <span className="prototype-market__list-col--pillar">
                    <Badge style={pillarMeta.badgeStyle} size="b3">{pillarMeta.label}</Badge>
                  </span>
                  <span className="prototype-market__list-col--stage">
                    <Badge style={stageMeta.badgeStyle} size="b3">{stageMeta.label}</Badge>
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
          <p className="body1-txt">No prototypes match your filters.</p>
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
            <button
              type="button"
              className="prototype-market__modal-close"
              onClick={() => setActivePrototype(null)}
              aria-label="Close details"
            >
              <i className="fa-solid fa-xmark" />
            </button>

            <div className="prototype-market__modal-top">
              <div className="prototype-market__modal-header-main">
                <div className="prototype-market__modal-badges">
                  <Badge style={(STAGE_META[activePrototype.stage] || STAGE_META.low).badgeStyle} size="b3">
                    {(STAGE_META[activePrototype.stage] || STAGE_META.low).label}
                  </Badge>
                  <Badge style={(PILLAR_META[activePrototype.productPillar] || PILLAR_META.universal).badgeStyle} size="b3">
                    {(PILLAR_META[activePrototype.productPillar] || PILLAR_META.universal).label}
                  </Badge>
                </div>
                <h3 className="prototype-market__modal-title h3">{activePrototype.title}</h3>
              </div>

              <div className="prototype-market__modal-actions">
                {getPrototypeOpenUrl(activePrototype) && (
                  <Button
                    className="prototype-market__modal-open-prototype"
                    style="primary"
                    fill="outline"
                    size="medium"
                    text="Open prototype"
                    trailingVisual={<i className="fa-solid fa-arrow-up-right-from-square" />}
                    onClick={(e) => openPrototypeInNewTab(activePrototype, e)}
                  />
                )}
                <Button
                  className="prototype-market__modal-upvote"
                  style="secondary"
                  fill="tonal"
                  active={upvotedIds.has(activePrototype.id)}
                  size="medium"
                  leadingVisual={<i className={`${upvotedIds.has(activePrototype.id) ? 'fa-solid' : 'fa-regular'} fa-thumbs-up`} />}
                  text={getUpvoteButtonLabel(upvoteCounts[activePrototype.id] || 0)}
                  onClick={() => toggleUpvote(activePrototype.id)}
                />
              </div>
            </div>

            <div className="prototype-market__modal-meta body2-txt">
              <span><i className="fa-regular fa-user" /> {activePrototype.creators?.join(', ') || 'User name'}</span>
              <span><i className="fa-regular fa-calendar" /> {formatDate(activePrototype.lastUpdated)}</span>
            </div>

            <div className="prototype-market__modal-links body2-txt">
              {activePrototype.localPath && (
                <a href={activePrototype.localPath}><i className="fa-solid fa-laptop" /> Local</a>
              )}
              {activePrototype.notionCardUrl && (
                <a href={activePrototype.notionCardUrl} target="_blank" rel="noopener noreferrer">
                  <i className="fa-brands fa-notion" /> {activePrototype.notionCardId || 'Notion'}
                </a>
              )}
              {activePrototype.deploymentUrl && (
                <a href={activePrototype.deploymentUrl} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-file-video" /> Loom Video
                </a>
              )}
            </div>

            <p className="prototype-market__modal-desc body1-txt">{activePrototype.description}</p>
            <hr />
            <h5 className="prototype-market__modal-section h5">Comments</h5>
            <div className="prototype-market__modal-comments">
              {(commentsById[activePrototype.id] || []).map((comment, idx) => (
                <div key={`${activePrototype.id}-comment-${idx}`} className="prototype-market__modal-comment body2-txt">
                  <div className="prototype-market__modal-comment-head">
                    <strong>{comment.author}</strong> <span>{comment.timestamp}</span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
            <div className="prototype-market__modal-feedback-row">
              <Input
                id="prototype-comment-input"
                placeholder="Share your feedback"
                showLabel={false}
                label="Share your feedback"
                size="medium"
                value={pendingComment}
                onChange={(e) => setPendingComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitComment();
                  }
                }}
              />
              <button
                type="button"
                className="prototype-market__modal-send"
                onClick={submitComment}
                disabled={!pendingComment.trim()}
                aria-label="Send comment"
              >
                <i className="fa-solid fa-paper-plane" />
              </button>
            </div>
            <hr />
            <h5 className="prototype-market__modal-section h5">Preview</h5>
            <div className="prototype-market__modal-preview">
              {getPrototypeOpenUrl(activePrototype) ? (
                <button
                  type="button"
                  className="prototype-market__modal-preview-link"
                  onClick={(e) => openPrototypeInNewTab(activePrototype, e)}
                >
                  {missingPreviews.has(activePrototype.id) ? (
                    <div className="prototype-market__modal-preview-fallback body2-txt">
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
                </button>
              ) : (
                <div className="prototype-market__modal-preview-fallback body2-txt">
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
