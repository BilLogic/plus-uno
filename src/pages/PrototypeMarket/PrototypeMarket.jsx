import React, { useState, useMemo, useEffect } from 'react';
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

const PrototypeMarket = () => {
  const [search, setSearch] = useState('');
  const [selectedStages, setSelectedStages] = useState([]);
  const [selectedPillars, setSelectedPillars] = useState([]);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('time');
  const [sortDirection, setSortDirection] = useState('desc');

  // Break out of demo frame when marketplace is active
  useEffect(() => {
    document.documentElement.classList.add('market-active');
    document.body.classList.add('market-active');
    return () => {
      document.documentElement.classList.remove('market-active');
      document.body.classList.remove('market-active');
    };
  }, []);

  const hasFilters = selectedStages.length > 0 || selectedPillars.length > 0 || selectedCreators.length > 0 || search;

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
      </div>

      {/* Result count + view toggle */}
      <div className="prototype-market__toolbar">
        <div className="prototype-market__count body2-txt">
          {sorted.length} {sorted.length === 1 ? 'prototype' : 'prototypes'}
          {hasFilters && (
            <Button
              text="Clear filters"
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
              <PrototypeCard key={proto.id} {...proto} />
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
    </div>
  );
};

export default PrototypeMarket;
